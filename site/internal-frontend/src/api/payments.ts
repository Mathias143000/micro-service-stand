import apiClient from "./client";
import type { ApiPage, PaymentRecord, PaymentStatus } from "../types";

export type { PaymentRecord, PaymentStatus } from "../types";

export interface PaymentCreateRequest {
  dealId: number;
  amount: string;
  bankOrganizationId?: number;
}

export async function listPayments(page = 0, size = 20, dealId?: number): Promise<ApiPage<PaymentRecord>> {
  const { data } = await apiClient.get<ApiPage<PaymentRecord>>("/payments", {
    params: { page, size, dealId }
  });
  return data;
}

export async function createPayment(payload: PaymentCreateRequest): Promise<PaymentRecord> {
  const { data } = await apiClient.post<PaymentRecord>("/payments", payload);
  return data;
}

export async function updatePaymentStatus(id: number, status: PaymentStatus): Promise<PaymentRecord> {
  const { data } = await apiClient.put<PaymentRecord>(`/payments/${id}/status`, null, {
    params: { status }
  });
  return data;
}
