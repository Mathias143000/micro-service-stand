import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentStaffUser, login as loginRequest, register as registerRequest } from "../api/auth";
import { clearStoredToken, getStoredToken, storeToken } from "../api/authStorage";
import { setUnauthorizedHandler } from "../api/client";
import { getRoleFromToken } from "../api/jwt";
import type { RegisterPayload, StaffRoleName, StaffUser, UserRole } from "../types";

interface AuthContextValue {
  token: string | null;
  role: UserRole | null;
  user: StaffUser | null;
  isAuthenticated: boolean;
  isResolvingSession: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload, keepCurrentSession?: boolean) => Promise<void>;
  hasRole: (role: StaffRoleName) => boolean;
  getDefaultRoute: () => string;
  refreshCurrentUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeRole(role: StaffRoleName): UserRole {
  return `ROLE_${role}` as UserRole;
}

function getDefaultRouteForRole(role: UserRole | null): string {
  if (role === "ROLE_BANK_EMPLOYEE") {
    return "/credits";
  }
  return "/deals";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isResolvingSession, setIsResolvingSession] = useState<boolean>(() => Boolean(getStoredToken()));

  const role = useMemo(() => getRoleFromToken(token), [token]);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setIsResolvingSession(false);
  }, []);

  const applyToken = useCallback((nextToken: string) => {
    storeToken(nextToken);
    setToken(nextToken);
    setUser(null);
    setIsResolvingSession(true);
  }, []);

  const resolveStaffRoleOrThrow = useCallback((nextToken: string, errorMessage: string) => {
    const resolvedRole = getRoleFromToken(nextToken);

    if (!resolvedRole || resolvedRole === "ROLE_MARKETPLACE_USER") {
      clearStoredToken();
      setToken(null);
      setUser(null);
      setIsResolvingSession(false);
      throw new Error(errorMessage);
    }

    return resolvedRole;
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!token || !role || role === "ROLE_MARKETPLACE_USER") {
      setUser(null);
      setIsResolvingSession(false);
      return;
    }

    setIsResolvingSession(true);
    try {
      const currentUser = await getCurrentStaffUser();
      setUser(currentUser);
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsResolvingSession(false);
    }
  }, [logout, role, token]);

  useEffect(() => {
    if (token && !role) {
      logout();
    }
  }, [logout, role, token]);

  useEffect(() => {
    if (!token || !role || role === "ROLE_MARKETPLACE_USER") {
      setUser(null);
      setIsResolvingSession(false);
      return;
    }

    let cancelled = false;
    setIsResolvingSession(true);

    getCurrentStaffUser()
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [logout, role, token]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    resolveStaffRoleOrThrow(response.token, "This account does not have access to the internal admin panel");
    applyToken(response.token);
  };

  const register = async (payload: RegisterPayload, keepCurrentSession = false) => {
    const response = await registerRequest(payload);

    if (keepCurrentSession && token) {
      return;
    }

    resolveStaffRoleOrThrow(response.token, "Internal registration returned a non-staff token");
    applyToken(response.token);
  };

  const hasRole = useCallback(
    (targetRole: StaffRoleName) => {
      if (!role) {
        return false;
      }
      return role === normalizeRole(targetRole);
    },
    [role]
  );

  const getDefaultRoute = useCallback(() => getDefaultRouteForRole(role), [role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      user,
      isAuthenticated: Boolean(token && role && user),
      isResolvingSession,
      login,
      register,
      hasRole,
      getDefaultRoute,
      refreshCurrentUser,
      logout
    }),
    [token, role, user, isResolvingSession, login, register, hasRole, getDefaultRoute, refreshCurrentUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
