import { TenantFormPage } from "@/modules/master/components/tenant-form-page";

interface EditarTenantPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarTenantPage({
  params,
}: EditarTenantPageProps) {
  const { id } = await params;

  return <TenantFormPage mode="edit" tenantId={id} />;
}
