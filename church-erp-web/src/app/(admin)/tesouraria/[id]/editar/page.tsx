import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import { TreasuryFormPage } from "@/modules/treasury/components/treasury-form-page";
import { canEditTreasury } from "@/modules/treasury/lib/treasury-permissions";

interface EditarMovimentacaoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarMovimentacaoPage({
  params,
}: EditarMovimentacaoPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!canEditTreasury(user)) {
    redirect("/tesouraria");
  }

  return <TreasuryFormPage mode="edit" movementId={id} />;
}
