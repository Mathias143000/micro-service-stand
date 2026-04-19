import apiClient from "./client";
import type { ApiPage, CreditApplication, CreditStatus } from "../types";

export type { CreditApplication, CreditStatus } from "../types";

export interface CreditApplicationRequest {
  amount: string;
  bankOrganizationId?: number;
}

export async function listCredits(page = 0, size = 20, dealId?: number): Promise<ApiPage<CreditApplication>> {
  const { data } = await apiClient.get<ApiPage<CreditApplication>>("/credits", {
    params: { page, size, dealId }
  });
  return data;
}

export async function createCreditForDeal(
  dealId: number,
  amount: string,
  bankOrganizationId?: number
): Promise<CreditApplication> {
  const { data } = await apiClient.post<CreditApplication>(`/credits/deal/${dealId}`, { amount, bankOrganizationId });
  return data;
}

export async function updateCreditStatus(
  id: number,
  status: CreditStatus,
  comment?: string
): Promise<CreditApplication> {
  const { data } = await apiClient.put<CreditApplication>(`/credits/${id}/status`, null, {
    params: { status, comment }
  });
  return data;
}
