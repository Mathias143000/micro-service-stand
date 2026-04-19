import apiClient from "./client";
import type {
  AnalyticsExportPreset,
  OrganizationAnalyticsDashboardResponse,
  RealtorAnalyticsResponse
} from "../types";

export async function getRealtorAnalytics(): Promise<RealtorAnalyticsResponse> {
  const { data } = await apiClient.get<RealtorAnalyticsResponse>("/analytics/realtor");
  return data;
}

export async function getOrganizationAnalyticsDashboard(organizationId?: number): Promise<OrganizationAnalyticsDashboardResponse> {
  const { data } = await apiClient.get<OrganizationAnalyticsDashboardResponse>("/analytics/organizations/dashboard", {
    params: {
      organizationId: organizationId && organizationId > 0 ? organizationId : undefined,
    },
  });
  return data;
}

export async function exportOrganizationAnalyticsDashboard(organizationId: number | undefined, preset: AnalyticsExportPreset): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/analytics/organizations/dashboard/export", {
    params: {
      organizationId: organizationId && organizationId > 0 ? organizationId : undefined,
      preset,
    },
    responseType: "blob",
  });
  return data;
}
