import type { RegisterPayload, StaffUser } from "../types";
import apiClient from "./client";

interface AuthPayload {
  token?: unknown;
  accessToken?: unknown;
  jwt?: unknown;
  bearerToken?: unknown;
  [key: string]: unknown;
}

export interface AuthResult {
  token: string;
  payload: AuthPayload;
}

function extractToken(payload: AuthPayload): string | null {
  const keys: Array<keyof AuthPayload> = ["token", "accessToken", "jwt", "bearerToken"];

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

async function authRequest(url: string, body: object): Promise<AuthResult> {
  const response = await apiClient.post<AuthPayload>(url, body);
  const payload = response.data ?? {};

  if (import.meta.env.DEV) {
    console.log("[AUTH PAYLOAD]", { url, payload });
  }

  const token = extractToken(payload);
  if (!token) {
    throw new Error(`JWT token not found in auth response. Full payload: ${JSON.stringify(payload)}`);
  }

  return { token, payload };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return authRequest("/auth/login", { email, password });
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  return authRequest("/auth/register", payload);
}

export async function getCurrentStaffUser(): Promise<StaffUser> {
  const response = await apiClient.get<StaffUser>("/auth/me");
  return response.data;
}
