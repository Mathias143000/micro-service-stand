import apiClient from "./client";
import type { ApiPage, StaffUser, UserRole } from "../types";

export interface UpdateUserPayload {
  fullName: string;
  username?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  organizationId?: number;
  enabled: boolean;
}

export interface UserListParams {
  page?: number;
  size?: number;
  role?: UserRole;
  enabled?: boolean;
  query?: string;
  organizationId?: number;
}

export async function getUsers(params: UserListParams = {}): Promise<ApiPage<StaffUser>> {
  const {
    page = 0,
    size = 50,
    role,
    enabled,
    query,
    organizationId,
  } = params;
  const response = await apiClient.get<ApiPage<StaffUser>>("/users", {
    params: {
      page,
      size,
      role,
      enabled,
      query: query?.trim() || undefined,
      organizationId: organizationId && organizationId > 0 ? organizationId : undefined,
    }
  });
  return response.data;
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<StaffUser> {
  const response = await apiClient.put<StaffUser>(`/users/${id}`, payload);
  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
