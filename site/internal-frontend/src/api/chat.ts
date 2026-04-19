import apiClient from "./client";

export interface Chat {
  id: number;
  deal: any;
}

export interface Message {
  id: number;
  text: string;
  sentAt?: string;
  roleLabel?: string;
}

export interface SendMessagePayload {
  chatId: number;
  text: string;
}

export async function getOrCreateChatForDeal(dealId: number): Promise<Chat> {
  const { data } = await apiClient.post<Chat>(`/chats/deal/${dealId}`);
  return data;
}

export async function listMessages(chatId: number): Promise<Message[]> {
  const { data } = await apiClient.get<Message[]>(`/chats/${chatId}/messages`);
  return data;
}

export async function sendMessage(payload: SendMessagePayload): Promise<Message> {
  const { data } = await apiClient.post<Message>("/chats/messages", payload);
  return data;
}
