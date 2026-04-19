import apiClient from "./client";
import type { ApiPage, MarketplaceDealStatus, MarketplaceLead } from "../types";

export interface MarketplaceLeadListParams {
  page?: number;
  size?: number;
  status?: MarketplaceDealStatus;
  query?: string;
}

export async function listMarketplaceDealsPage(params: MarketplaceLeadListParams = {}): Promise<ApiPage<MarketplaceLead>> {
  const {
    page = 0,
    size = 20,
    status,
    query,
  } = params;
  const { data } = await apiClient.get<ApiPage<MarketplaceLead>>("/internal/marketplace-deals", {
    params: {
      page,
      size,
      status,
      query: query?.trim() || undefined,
    },
  });
  return data;
}

export async function listMarketplaceDeals(params: MarketplaceLeadListParams = {}): Promise<MarketplaceLead[]> {
  const data = await listMarketplaceDealsPage({ ...params, size: params.size ?? 200 });
  return data.content;
}

export async function updateMarketplaceDealStatus(id: number, status: MarketplaceDealStatus): Promise<MarketplaceLead> {
  const { data } = await apiClient.put<MarketplaceLead>(`/internal/marketplace-deals/${id}/status`, { status });
  return data;
}
