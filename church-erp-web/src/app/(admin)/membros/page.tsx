import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import { MembersListPage } from "@/modules/members/components/members-list-page";
import { canEditMembers } from "@/modules/members/lib/members-permissions";

export default async function MembrosPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  return (
    <MembersListPage
      canEdit={canEditMembers(user)}
      currentUser={user}
    />
  );
}
