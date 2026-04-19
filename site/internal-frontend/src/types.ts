export type UserRole =
  | "ROLE_MARKETPLACE_USER"
  | "ROLE_REALTOR"
  | "ROLE_BANK_EMPLOYEE"
  | "ROLE_ADMIN";

export type StaffRoleName = "ADMIN" | "REALTOR" | "BANK_EMPLOYEE";

export type DealStatus =
  | "DRAFT"
  | "WAITING_FOR_PAYMENT"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "CREATED"
  | "IN_PROGRESS"
  | "APPROVED"
  | "REJECTED";

export type DealType = "RENT" | "SALE";
export type CreditStatus = "CREATED" | "APPROVED" | "REJECTED" | "ISSUED";
export type PaymentStatus = "CREATED" | "CONFIRMED" | "FAILED";
export type ContractType = "SALE" | "RENT";
export type ContractStatus = "DRAFT" | "SIGNED" | "COMPLETED" | "CANCELLED";
export type PropertyType = "FOR_SALE" | "FOR_RENT" | "BOTH";
export type PropertyStatus = "AVAILABLE" | "RESERVED" | "RENTED" | "SOLD" | "ARCHIVED";
export type MarketplaceDealStatus = "REQUESTED" | "IN_REVIEW" | "VIEWING" | "NEGOTIATION" | "APPROVED" | "DECLINED" | "CLOSED";

export interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface DealRelation {
  id: number;
  address?: string | null;
  name?: string | null;
}

export interface Organization {
  id: number;
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationReference {
  id: number;
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface StaffUser {
  id: number;
  username?: string | null;
  email: string;
  fullName: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  organizationId?: number | null;
  organizationName?: string | null;
  enabled: boolean;
  createdAt?: string | null;
}

export interface SupportParticipant {
  id: number;
  username?: string | null;
  email?: string | null;
  avatar?: string | null;
}

export interface SupportMessage {
  id: number;
  text: string;
  sentAt?: string | null;
  senderLabel: string;
  mine: boolean;
}

export interface SupportConversationSummary {
  conversationId: number;
  customer?: SupportParticipant | null;
  assignedRealtor?: SupportParticipant | null;
  lastMessagePreview?: string | null;
  updatedAt?: string | null;
}

export interface SupportConversationDetail {
  conversationId: number;
  customer?: SupportParticipant | null;
  assignedRealtor?: SupportParticipant | null;
  messages: SupportMessage[];
}

export interface MarketplaceLeadCustomer {
  id: number;
  username?: string | null;
  email?: string | null;
  avatar?: string | null;
  mobile_number?: string | null;
}

export interface MarketplaceLead {
  id: number;
  status: MarketplaceDealStatus;
  note?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  postId: number;
  postTitle?: string | null;
  postAddress: string;
  city?: string | null;
  price: number;
  type: "buy" | "rent";
  customer?: MarketplaceLeadCustomer | null;
  assignedRealtor?: SupportParticipant | null;
}

export interface CreditApplication {
  id: number;
  dealId: number;
  propertyId: number;
  propertyAddress: string;
  buyerOrganizationId: number;
  buyerOrganizationName: string;
  bankOrganizationId?: number | null;
  bankOrganizationName?: string | null;
  dealType: DealType;
  dealStatus: DealStatus;
  status: CreditStatus;
  amount: number | string;
  bankComment?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: number;
  dealId: number;
  propertyId: number;
  propertyAddress: string;
  buyerOrganizationId: number;
  buyerOrganizationName: string;
  bankOrganizationId?: number | null;
  bankOrganizationName?: string | null;
  dealType: DealType;
  dealStatus: DealStatus;
  status: PaymentStatus;
  amount: number | string;
  paymentDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Deal {
  id: number;
  type: DealType;
  status: DealStatus;
  createdAt?: string;
  property?: DealRelation | null;
  buyerOrganization?: DealRelation | null;
  sellerOrganization?: DealRelation | null;
  creditRequired?: boolean;
  creditAmount?: number | string | null;
  creditApplication?: CreditApplication | null;
}

export interface DealReference {
  id: number;
  type: DealType;
  status: DealStatus;
  propertyId: number;
  propertyAddress: string;
  buyerOrganizationId: number;
  buyerOrganizationName: string;
  hasCreditApplication: boolean;
}

export interface Contract {
  id: number;
  propertyId: number;
  propertyAddress: string;
  sellerOrganizationId: number;
  sellerOrganizationName: string;
  buyerOrganizationId: number;
  buyerOrganizationName: string;
  type: ContractType;
  status: ContractStatus;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractPayload {
  propertyId: number;
  sellerOrganizationId: number;
  buyerOrganizationId: number;
  type: ContractType;
  price: number;
}

export interface Property {
  id: number;
  organizationId?: number | null;
  organizationName?: string | null;
  ownerId?: number | null;
  ownerName?: string | null;
  title?: string | null;
  type: PropertyType;
  status: PropertyStatus;
  address: string;
  city?: string | null;
  floor: number | null;
  bedroom?: number | null;
  bathroom?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  area: number;
  listingCategory?: string | null;
  purpose?: string | null;
  description?: string | null;
  conditions?: string | null;
  utilities?: string | null;
  petPolicy?: string | null;
  incomePolicy?: string | null;
  schoolDistanceKm?: number | null;
  busDistanceKm?: number | null;
  restaurantDistanceKm?: number | null;
  purchasePrice: number | null;
  rentPrice: number | null;
  published?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyPayload {
  organizationId: number;
  title?: string;
  type: PropertyType;
  status?: PropertyStatus;
  address: string;
  city?: string;
  floor?: number;
  bedroom?: number;
  bathroom?: number;
  latitude?: number;
  longitude?: number;
  area: number;
  listingCategory?: string;
  purpose?: string;
  description?: string;
  conditions?: string;
  utilities?: string;
  petPolicy?: string;
  incomePolicy?: string;
  schoolDistanceKm?: number;
  busDistanceKm?: number;
  restaurantDistanceKm?: number;
  purchasePrice?: number;
  rentPrice?: number;
  published?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  organizationId?: number;
}

export interface CreateOrganizationPayload {
  name: string;
}

export interface DealCreateRequest {
  type: DealType;
  propertyId: number;
  buyerOrganizationId: number;
  rentPeriodId?: number | null;
  creditRequired: boolean;
  creditAmount?: string | null;
}

export interface RealtorAnalyticsResponse {
  totalDeals: number;
  buyDeals: number;
  rentDeals: number;
  activeDeals: number;
  totalProperties: number;
  availableProperties: number;
  totalContracts: number;
  signedContracts: number;
  totalCredits: number;
  issuedCredits: number;
  totalPayments: number;
  confirmedPayments: number;
  rentSharePercent: number;
  buySharePercent: number;
  activeDealSharePercent: number;
}

export type AnalyticsExportPreset = "EXECUTIVE_SUMMARY" | "DEAL_PIPELINE" | "FINANCE_CONTROL";

export interface OrganizationAnalyticsDashboardResponse {
  organizationId: number;
  organizationName: string;
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  saleDeals: number;
  rentDeals: number;
  totalContracts: number;
  signedContracts: number;
  completedContracts: number;
  totalCredits: number;
  createdCredits: number;
  issuedCredits: number;
  totalPayments: number;
  confirmedPayments: number;
  failedPayments: number;
  contractVolume: number;
  issuedCreditVolume: number;
  confirmedPaymentVolume: number;
}
