import apiClient from "./client";
import type { ApiPage, SupportConversationDetail, SupportConversationSummary } from "../types";

export interface SupportConversationListParams {
  page?: number;
  size?: number;
  query?: string;
}

export async function listSupportConversationsPage(params: SupportConversationListParams = {}): Promise<ApiPage<SupportConversationSummary>> {
  const {
    page = 0,
    size = 20,
    query,
  } = params;
  const { data } = await apiClient.get<ApiPage<SupportConversationSummary>>("/internal/support-chat/conversations", {
    params: {
      page,
      size,
      query: query?.trim() || undefined,
    },
  });
  return data;
}

export async function listSupportConversations(params: SupportConversationListParams = {}): Promise<SupportConversationSummary[]> {
  const data = await listSupportConversationsPage({ ...params, size: params.size ?? 200 });
  return data.content;
}

export async function getSupportConversation(conversationId: number): Promise<SupportConversationDetail> {
  const { data } = await apiClient.get<SupportConversationDetail>(`/internal/support-chat/conversations/${conversationId}`);
  return data;
}

export async function sendSupportConversationMessage(conversationId: number, text: string): Promise<SupportConversationDetail> {
  const { data } = await apiClient.post<SupportConversationDetail>(
    `/internal/support-chat/conversations/${conversationId}/messages`,
    { text }
  );
  return data;
}
