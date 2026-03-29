export type CampaignStatus = "ACTIVE" | "CLOSED";

export type CampaignInstallmentStatus = "PAID" | "UNPAID";

export interface CampaignItem {
  id: string;
  churchId: string;
  churchName: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  installmentCount: number;
  installmentAmount: string;
  startDate: string | null;
  status: CampaignStatus;
  membersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignInstallmentItem {
  id: string;
  campaignMemberId: string;
  installmentNumber: number;
  amount: string;
  dueDate: string | null;
  status: CampaignInstallmentStatus;
  paidAt: string | null;
  notes: string | null;
}

export interface CampaignMemberItem {
  id: string;
  campaignId: string;
  memberId: string;
  memberName: string;
  joinedAt: string;
  notes: string | null;
  installments: CampaignInstallmentItem[];
}

export interface CampaignDetailItem extends CampaignItem {
  members: CampaignMemberItem[];
}

export interface CampaignFilters {
  title: string;
  churchId: string;
  status: CampaignStatus | "";
}

export interface CampaignListResult {
  items: CampaignItem[];
  total: number;
}

export interface CreateCampaignPayload {
  churchId: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  installmentCount: number;
  installmentAmount: string;
  startDate: string | null;
  status: CampaignStatus;
}

export interface UpdateCampaignPayload {
  churchId?: string;
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  installmentCount?: number;
  installmentAmount?: string;
  startDate?: string | null;
  status?: CampaignStatus;
}

export interface AddCampaignMemberPayload {
  memberId: string;
  joinedAt?: string | null;
  notes?: string | null;
}

export interface MarkCampaignInstallmentPaidPayload {
  paidAt?: string | null;
  notes?: string | null;
}

export interface MarkCampaignInstallmentUnpaidPayload {
  notes?: string | null;
}

export interface CampaignFormValues {
  churchId: string;
  title: string;
  description: string;
  imageUrl: string;
  installmentCount: string;
  installmentAmount: string;
  startDate: string;
  status: CampaignStatus;
}

export interface CampaignImageUploadResponse {
  imageUrl: string;
}

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativa" },
  { value: "CLOSED", label: "Encerrada" },
] as const;
