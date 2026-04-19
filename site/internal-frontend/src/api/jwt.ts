import type { UserRole } from "../types";

interface JwtPayload {
  role?: string;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function getRoleFromToken(token: string | null): UserRole | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
    if (payload.role === "ROLE_ADMIN" || payload.role === "ROLE_REALTOR" || payload.role === "ROLE_BANK_EMPLOYEE") {
      return payload.role;
    }
    return null;
  } catch {
    return null;
  }
}
