import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TenantBrandingPage } from "@/modules/admin/components/tenant-branding-page";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";

export default async function ConfiguracoesPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!user || !user.tenantId) {
    redirect("/dashboard");
  }

  return <TenantBrandingPage user={user} />;
}
