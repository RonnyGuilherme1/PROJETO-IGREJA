import { ensureApiConfigured, http } from "@/lib/http";
import type {
  AddCampaignMemberPayload,
  CampaignDetailItem,
  CampaignFilters,
  CampaignImageUploadResponse,
  CampaignItem,
  CampaignListResult,
  CreateCampaignPayload,
  MarkCampaignInstallmentPaidPayload,
  MarkCampaignInstallmentUnpaidPayload,
  UpdateCampaignPayload,
} from "@/modules/campaigns/types/campaign";

const CAMPAIGNS_ENDPOINT = "/campaigns";
const CAMPAIGN_IMAGE_UPLOAD_FIELD = "image";

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function matchesCampaignFilters(
  campaign: CampaignItem,
  filters: CampaignFilters,
) {
  const title = normalizeSearchValue(filters.title);

  return (
    (!title ||
      normalizeSearchValue(campaign.title).includes(title) ||
      normalizeSearchValue(campaign.description ?? "").includes(title) ||
      normalizeSearchValue(campaign.churchName).includes(title)) &&
    (!filters.churchId || campaign.churchId === filters.churchId) &&
    (!filters.status || campaign.status === filters.status)
  );
}

function sanitizeCampaignPayload(
  payload: CreateCampaignPayload | UpdateCampaignPayload,
) {
  const sanitizedPayload = {
    ...payload,
    churchId:
      "churchId" in payload && payload.churchId !== undefined
        ? payload.churchId.trim()
        : undefined,
    title:
      "title" in payload && payload.title !== undefined
        ? payload.title.trim()
        : undefined,
    description:
      "description" in payload && payload.description !== undefined
        ? payload.description?.trim() || null
        : undefined,
    imageUrl:
      "imageUrl" in payload && payload.imageUrl !== undefined
        ? payload.imageUrl?.trim() || null
        : undefined,
    installmentCount:
      "installmentCount" in payload && payload.installmentCount !== undefined
        ? payload.installmentCount
        : undefined,
    installmentAmount:
      "installmentAmount" in payload && payload.installmentAmount !== undefined
        ? payload.installmentAmount.trim().replace(",", ".")
        : undefined,
    startDate:
      "startDate" in payload && payload.startDate !== undefined
        ? payload.startDate?.trim() || null
        : undefined,
    status: payload.status,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

function sanitizeAddCampaignMemberPayload(payload: AddCampaignMemberPayload) {
  const sanitizedPayload = {
    memberId: payload.memberId.trim(),
    joinedAt:
      payload.joinedAt !== undefined ? payload.joinedAt?.trim() || null : undefined,
    notes: payload.notes !== undefined ? payload.notes?.trim() || null : undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

function sanitizeMarkPaidPayload(payload?: MarkCampaignInstallmentPaidPayload) {
  if (!payload) {
    return undefined;
  }

  const sanitizedPayload = {
    paidAt: payload.paidAt !== undefined ? payload.paidAt?.trim() || null : undefined,
    notes: payload.notes !== undefined ? payload.notes?.trim() || null : undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

function sanitizeMarkUnpaidPayload(
  payload?: MarkCampaignInstallmentUnpaidPayload,
) {
  if (!payload) {
    return undefined;
  }

  const sanitizedPayload = {
    notes: payload.notes !== undefined ? payload.notes?.trim() || null : undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function listCampaigns(
  filters: CampaignFilters,
): Promise<CampaignListResult> {
  ensureApiConfigured();

  const response = await http.get<CampaignItem[]>(CAMPAIGNS_ENDPOINT);
  const items = response.data.filter((campaign) =>
    matchesCampaignFilters(campaign, filters),
  );

  return {
    items,
    total: items.length,
  };
}

export async function getCampaignById(id: string): Promise<CampaignDetailItem> {
  ensureApiConfigured();

  const response = await http.get<CampaignDetailItem>(`${CAMPAIGNS_ENDPOINT}/${id}`);
  return response.data;
}

export async function createCampaign(
  payload: CreateCampaignPayload,
): Promise<CampaignItem> {
  ensureApiConfigured();

  const response = await http.post<CampaignItem>(
    CAMPAIGNS_ENDPOINT,
    sanitizeCampaignPayload(payload),
  );

  return response.data;
}

export async function updateCampaign(
  id: string,
  payload: UpdateCampaignPayload,
): Promise<CampaignItem> {
  ensureApiConfigured();

  const response = await http.patch<CampaignItem>(
    `${CAMPAIGNS_ENDPOINT}/${id}`,
    sanitizeCampaignPayload(payload),
  );

  return response.data;
}

export async function uploadCampaignImage(
  id: string,
  file: File,
): Promise<CampaignImageUploadResponse> {
  ensureApiConfigured();

  const formData = new FormData();
  formData.append(CAMPAIGN_IMAGE_UPLOAD_FIELD, file);

  const response = await http.postForm<CampaignImageUploadResponse>(
    `${CAMPAIGNS_ENDPOINT}/${id}/image`,
    formData,
  );

  return response.data;
}

export async function addCampaignMember(
  campaignId: string,
  payload: AddCampaignMemberPayload,
) {
  ensureApiConfigured();

  const response = await http.post(
    `${CAMPAIGNS_ENDPOINT}/${campaignId}/members`,
    sanitizeAddCampaignMemberPayload(payload),
  );

  return response.data;
}

export async function markCampaignInstallmentPaid(
  installmentId: string,
  payload?: MarkCampaignInstallmentPaidPayload,
) {
  ensureApiConfigured();

  const response = await http.patch(
    `${CAMPAIGNS_ENDPOINT}/installments/${installmentId}/pay`,
    sanitizeMarkPaidPayload(payload),
  );

  return response.data;
}

export async function markCampaignInstallmentUnpaid(
  installmentId: string,
  payload?: MarkCampaignInstallmentUnpaidPayload,
) {
  ensureApiConfigured();

  const response = await http.patch(
    `${CAMPAIGNS_ENDPOINT}/installments/${installmentId}/unpay`,
    sanitizeMarkUnpaidPayload(payload),
  );

  return response.data;
}
