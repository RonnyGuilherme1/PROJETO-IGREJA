import { PlatformUserFormPage } from "@/modules/master/components/platform-user-form-page";

interface EditarUsuarioMasterPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarUsuarioMasterPage({
  params,
}: EditarUsuarioMasterPageProps) {
  const { id } = await params;

  return <PlatformUserFormPage mode="edit" userId={id} />;
}
