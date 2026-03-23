import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import { TreasuryFormPage } from "@/modules/treasury/components/treasury-form-page";
import { canEditTreasury } from "@/modules/treasury/lib/treasury-permissions";

export default async function NovaMovimentacaoPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!canEditTreasury(user?.profile)) {
    redirect("/tesouraria");
  }

  return <TreasuryFormPage mode="create" />;
}
