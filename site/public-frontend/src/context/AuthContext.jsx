import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function getInitialUser() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser);
    const payload = decodeJwtPayload(parsedUser?.token || "");

    if (payload?.role && payload.role !== "ROLE_MARKETPLACE_USER") {
      localStorage.removeItem("user");
      return null;
    }

    return parsedUser;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(getInitialUser);

  const updateUser = (data) => {
    setCurrentUser(data);
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("user", JSON.stringify(currentUser));
      return;
    }

    localStorage.removeItem("user");
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser,updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
