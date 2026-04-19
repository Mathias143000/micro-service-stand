import apiClient from "./client";
import type { ApiPage, Contract, ContractStatus, ContractType, CreateContractPayload } from "../types";

export interface ContractListParams {
  page?: number;
  size?: number;
  status?: ContractStatus;
  type?: ContractType;
  query?: string;
  organizationId?: number;
}

export async function getContracts(params: ContractListParams = {}): Promise<ApiPage<Contract>> {
  const {
    page = 0,
    size = 20,
    status,
    type,
    query,
    organizationId,
  } = params;
  const response = await apiClient.get<ApiPage<Contract>>("/contracts", {
    params: {
      page,
      size,
      status,
      type,
      query: query?.trim() || undefined,
      organizationId: organizationId && organizationId > 0 ? organizationId : undefined,
    }
  });
  return response.data;
}

export async function createContract(payload: CreateContractPayload): Promise<Contract> {
  const response = await apiClient.post<Contract>("/contracts", payload);
  return response.data;
}

export async function updateContractStatus(id: number, status: ContractStatus): Promise<Contract> {
  const response = await apiClient.put<Contract>(`/contracts/${id}/status`, null, {
    params: { status }
  });
  return response.data;
}
