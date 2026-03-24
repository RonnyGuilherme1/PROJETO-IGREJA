import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/modules/admin/components/admin-shell";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!user) {
    redirect("/login");
  }

  if (user.accessType === "PLATFORM") {
    redirect("/master/dashboard");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
