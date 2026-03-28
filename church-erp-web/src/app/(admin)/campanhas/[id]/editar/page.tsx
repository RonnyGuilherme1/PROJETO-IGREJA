import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import type { AuthUser } from "@/modules/auth/types/auth";
import { CampaignFormPage } from "@/modules/campaigns/components/campaign-form-page";

interface EditarCampanhaPageProps {
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

export default async function EditarCampanhaPage({
  params,
}: EditarCampanhaPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!canEditCampaigns(user)) {
    redirect(`/campanhas/${id}`);
  }

  return <CampaignFormPage mode="edit" campaignId={id} />;
}
