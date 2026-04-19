import apiClient from "./client";

export interface InternalNavCountersResponse {
  openLeadCount: number;
  supportConversationCount: number;
  pendingCreditCount: number;
}

export async function getInternalNavCounters(): Promise<InternalNavCountersResponse> {
  const { data } = await apiClient.get<InternalNavCountersResponse>("/internal/dashboard/counters");
  return data;
}
