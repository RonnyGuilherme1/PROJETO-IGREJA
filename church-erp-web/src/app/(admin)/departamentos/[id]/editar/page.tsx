import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import type { AuthUser } from "@/modules/auth/types/auth";
import { DepartmentFormPage } from "@/modules/departments/components/department-form-page";

interface EditarDepartamentoPageProps {
  params: Promise<{
    id: string;
  }>;
}

function canEditDepartments(user?: AuthUser | null) {
  return (
    user?.accessType === "TENANT" &&
    (user.role === "ADMIN" || user.role === "SECRETARIA")
  );
}

export default async function EditarDepartamentoPage({
  params,
}: EditarDepartamentoPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!canEditDepartments(user)) {
    redirect("/departamentos");
  }

  return <DepartmentFormPage mode="edit" departmentId={id} />;
}
