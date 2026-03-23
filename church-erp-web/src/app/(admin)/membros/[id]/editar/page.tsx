import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import { MemberFormPage } from "@/modules/members/components/member-form-page";
import { canEditMembers } from "@/modules/members/lib/members-permissions";

interface EditarMembroPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarMembroPage({
  params,
}: EditarMembroPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!canEditMembers(user?.profile)) {
    redirect("/membros");
  }

  return <MemberFormPage mode="edit" memberId={id} />;
}
