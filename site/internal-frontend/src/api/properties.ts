import apiClient from "./client";
import type { ApiPage, CreatePropertyPayload, Property } from "../types";

export async function getProperties(page = 0, size = 20): Promise<ApiPage<Property>> {
  const response = await apiClient.get<ApiPage<Property>>("/properties", {
    params: { page, size }
  });
  return response.data;
}

export async function createProperty(payload: CreatePropertyPayload): Promise<Property> {
  const response = await apiClient.post<Property>("/properties", payload);
  return response.data;
}

export async function updateProperty(id: number, payload: CreatePropertyPayload): Promise<Property> {
  const response = await apiClient.put<Property>(`/properties/${id}`, payload);
  return response.data;
}

export async function archiveProperty(id: number): Promise<void> {
  await apiClient.delete(`/properties/${id}`);
}
