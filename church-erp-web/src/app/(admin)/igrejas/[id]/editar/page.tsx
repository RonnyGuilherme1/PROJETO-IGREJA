import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";
import { ChurchFormPage } from "@/modules/churches/components/church-form-page";
import { canEditChurches } from "@/modules/churches/lib/churches-permissions";

interface EditarIgrejaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarIgrejaPage({
  params,
}: EditarIgrejaPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const user = getStoredAuthUser(
    accessToken,
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!canEditChurches(user?.profile)) {
    redirect("/igrejas");
  }

  return <ChurchFormPage mode="edit" churchId={id} />;
}
