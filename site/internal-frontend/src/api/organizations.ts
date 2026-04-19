import type { ApiPage, CreateOrganizationPayload, Organization, OrganizationReference } from "../types";
import apiClient from "./client";

export async function getOrganizations(page = 0, size = 20): Promise<ApiPage<Organization>> {
  const response = await apiClient.get<ApiPage<Organization>>("/organizations", {
    params: { page, size }
  });
  return response.data;
}

export async function getOrganizationReferences(): Promise<OrganizationReference[]> {
  const response = await apiClient.get<OrganizationReference[]>("/organizations/reference");
  return response.data;
}

export async function createOrganization(payload: CreateOrganizationPayload): Promise<Organization> {
  const response = await apiClient.post<Organization>("/organizations", payload);
  return response.data;
}
