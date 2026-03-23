import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MasterShell } from "@/modules/master/components/master-shell";
import { canAccessMasterArea } from "@/modules/master/lib/master-access";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";

export default async function MasterPlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    redirect("/master/login");
  }

  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!user || !canAccessMasterArea(user)) {
    redirect("/dashboard");
  }

  return <MasterShell user={user}>{children}</MasterShell>;
}
