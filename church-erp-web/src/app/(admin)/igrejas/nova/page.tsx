import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import { ChurchFormPage } from "@/modules/churches/components/church-form-page";
import { canEditChurches } from "@/modules/churches/lib/churches-permissions";

export default async function NovaIgrejaPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!canEditChurches(user?.profile)) {
    redirect("/igrejas");
  }

  return <ChurchFormPage mode="create" />;
}
