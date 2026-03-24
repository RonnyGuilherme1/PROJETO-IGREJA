import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";

export default async function BancoLayout({
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

  if (!user || user.accessType !== "TENANT" || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return children;
}
