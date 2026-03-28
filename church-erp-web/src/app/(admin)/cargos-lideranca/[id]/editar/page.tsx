import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import type { AuthUser } from "@/modules/auth/types/auth";
import { LeadershipRoleFormPage } from "@/modules/leadership-roles/components/leadership-role-form-page";

interface EditarCargoLiderancaPageProps {
  params: Promise<{
    id: string;
  }>;
}

function canEditLeadershipRoles(user?: AuthUser | null) {
  return (
    user?.accessType === "TENANT" &&
    (user.role === "ADMIN" || user.role === "SECRETARIA")
  );
}

export default async function EditarCargoLiderancaPage({
  params,
}: EditarCargoLiderancaPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!canEditLeadershipRoles(user)) {
    redirect("/cargos-lideranca");
  }

  return <LeadershipRoleFormPage mode="edit" leadershipRoleId={id} />;
}
