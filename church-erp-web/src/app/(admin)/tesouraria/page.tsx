import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import { TreasuryListPage } from "@/modules/treasury/components/treasury-list-page";
import { canEditTreasury } from "@/modules/treasury/lib/treasury-permissions";

export default async function TesourariaPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  return (
    <TreasuryListPage
      canEdit={canEditTreasury(user?.profile)}
      currentProfile={user?.profile}
    />
  );
}
