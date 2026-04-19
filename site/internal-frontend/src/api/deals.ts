import apiClient from "./client";
import type { ApiPage, Deal, DealCreateRequest, DealReference, DealStatus, DealType } from "../types";

export type { Deal, DealCreateRequest, DealReference, DealStatus, DealType } from "../types";

export interface DealListParams {
  page?: number;
  size?: number;
  status?: DealStatus;
  type?: DealType;
  query?: string;
}

export async function listDeals(params: DealListParams = {}): Promise<ApiPage<Deal>> {
  const {
    page = 0,
    size = 20,
    status,
    type,
    query,
  } = params;
  const { data } = await apiClient.get<ApiPage<Deal>>("/deals", {
    params: {
      page,
      size,
      status,
      type,
      query: query?.trim() || undefined,
    },
  });
  return data;
}

export async function createDeal(payload: DealCreateRequest): Promise<Deal> {
  const { data } = await apiClient.post<Deal>("/deals", payload);
  return data;
}

export async function listDealReferences(): Promise<DealReference[]> {
  const { data } = await apiClient.get<DealReference[]>("/deals/reference");
  return data;
}

export async function updateDealStatus(id: number, status: DealStatus): Promise<{ id: number; status: DealStatus }> {
  const { data } = await apiClient.put<{ id: number; status: DealStatus }>(`/deals/${id}/status`, null, {
    params: { status }
  });
  return data;
}
