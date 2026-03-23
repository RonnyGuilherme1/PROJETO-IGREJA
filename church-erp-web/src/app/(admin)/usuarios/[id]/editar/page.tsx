import { UserFormPage } from "@/modules/users/components/user-form-page";

interface EditarUsuarioPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarUsuarioPage({
  params,
}: EditarUsuarioPageProps) {
  const { id } = await params;

  return <UserFormPage mode="edit" userId={id} />;
}
