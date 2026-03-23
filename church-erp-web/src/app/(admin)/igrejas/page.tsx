import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import { ChurchesListPage } from "@/modules/churches/components/churches-list-page";
import { canEditChurches } from "@/modules/churches/lib/churches-permissions";

export default async function IgrejasPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  return (
    <ChurchesListPage
      canEdit={canEditChurches(user?.profile)}
      currentProfile={user?.profile}
    />
  );
}
