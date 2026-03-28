import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import type { AuthUser } from "@/modules/auth/types/auth";
import { CampaignDetailsPage } from "@/modules/campaigns/components/campaign-details-page";

interface CampanhaDetalhePageProps {
  params: Promise<{
    id: string;
  }>;
}

function canEditCampaigns(user?: AuthUser | null) {
  return (
    user?.accessType === "TENANT" &&
    (user.role === "ADMIN" || user.role === "SECRETARIA")
  );
}

export default async function CampanhaDetalhePage({
  params,
}: CampanhaDetalhePageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  return <CampaignDetailsPage campaignId={id} canEdit={canEditCampaigns(user)} />;
}
