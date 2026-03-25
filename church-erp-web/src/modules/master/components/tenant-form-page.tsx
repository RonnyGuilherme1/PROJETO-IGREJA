"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import {
  getTenantThemeLabel,
  normalizeTenantLogoUrl,
} from "@/lib/tenant-branding";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ErrorView } from "@/components/shared/error-view";
import { PageLoading } from "@/components/shared/page-loading";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  createMasterTenant,
  getMasterTenantById,
  updateMasterTenant,
  uploadMasterTenantLogo,
} from "@/modules/master/services/master-tenants-service";
import {
  DEFAULT_TENANT_THEME_KEY,
  MASTER_TENANT_STATUS_OPTIONS,
  MASTER_TENANT_THEME_OPTIONS,
  type CreateMasterTenantPayload,
  type MasterTenantItem,
  type MasterTenantFormValues,
  type UpdateMasterTenantPayload,
} from "@/modules/master/types/tenant";

interface TenantFormPageProps {
  mode: "create" | "edit";
  tenantId?: string;
}

const TENANT_LOGO_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
].join(",");

const TENANT_LOGO_ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const TENANT_LOGO_ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

const TENANT_LOGO_MAX_FILE_SIZE = 1024 * 1024;

const feedbackMessages = {
  created: "Ambiente criado com sucesso.",
  createdLogo: "Ambiente criado e logo enviada com sucesso.",
} as const;

const initialFormValues: MasterTenantFormValues = {
  name: "",
  code: "",
  status: "ACTIVE",
  logoUrl: "",
  themeKey: DEFAULT_TENANT_THEME_KEY,
  adminName: "",
  adminUsername: "",
  adminEmail: "",
  adminPassword: "",
};

function buildFormValues(
  tenant: Pick<
    MasterTenantItem,
    "name" | "code" | "status" | "logoUrl" | "themeKey"
  >,
): MasterTenantFormValues {
  return {
    name: tenant.name,
    code: tenant.code,
    status: tenant.status || "ACTIVE",
    logoUrl: tenant.logoUrl ?? "",
    themeKey: tenant.themeKey,
    adminName: "",
    adminUsername: "",
    adminEmail: "",
    adminPassword: "",
  };
}

function validateTenantLogoFile(file: File): string | null {
  if (file.size > TENANT_LOGO_MAX_FILE_SIZE) {
    return "A logo do ambiente deve ter no maximo 1 MB.";
  }

  const normalizedMimeType = file.type.trim().toLowerCase();
  const extensionIndex = file.name.lastIndexOf(".");
  const normalizedExtension =
    extensionIndex >= 0 ? file.name.slice(extensionIndex).toLowerCase() : "";
  const hasAllowedMimeType =
    normalizedMimeType.length > 0 &&
    TENANT_LOGO_ALLOWED_MIME_TYPES.has(normalizedMimeType);
  const hasAllowedExtension =
    normalizedExtension.length > 0 &&
    TENANT_LOGO_ALLOWED_EXTENSIONS.has(normalizedExtension);

  if (
    (normalizedMimeType && !hasAllowedMimeType) ||
    (normalizedExtension && !hasAllowedExtension) ||
    (!normalizedMimeType && !hasAllowedExtension)
  ) {
    return "Selecione uma imagem PNG, JPG, JPEG ou WEBP.";
  }

  return null;
}

function getSuccessMessage(
  previousValues: Pick<MasterTenantFormValues, "themeKey" | "logoUrl">,
  nextValues: Pick<MasterTenantFormValues, "themeKey" | "logoUrl">,
): string {
  const previousLogoUrl = normalizeTenantLogoUrl(previousValues.logoUrl);
  const nextLogoUrl = normalizeTenantLogoUrl(nextValues.logoUrl);
  const logoChanged = previousLogoUrl !== nextLogoUrl;
  const themeChanged = previousValues.themeKey !== nextValues.themeKey;

  if (logoChanged && themeChanged) {
    return "Logo e tema do ambiente atualizados com sucesso.";
  }

  if (logoChanged && nextLogoUrl) {
    return "Logo do ambiente atualizada com sucesso.";
  }

  if (logoChanged) {
    return "Logo removida. O ambiente voltou a usar a marca padrao.";
  }

  if (themeChanged) {
    return "Tema do ambiente atualizado com sucesso.";
  }

  return "Ambiente atualizado com sucesso.";
}

export function TenantFormPage({ mode, tenantId }: TenantFormPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [formValues, setFormValues] = useState<MasterTenantFormValues>(initialFormValues);
  const [persistedTenant, setPersistedTenant] = useState<MasterTenantItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedLogoPreviewUrl, setSelectedLogoPreviewUrl] = useState<
    string | null
  >(null);
  const [logoInputKey, setLogoInputKey] = useState(0);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedLogoFile) {
      setSelectedLogoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedLogoFile);
    setSelectedLogoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedLogoFile]);

  useEffect(() => {
    setSuccessMessage(null);
    setPersistedTenant(null);
    resetSelectedLogoState();
  }, [mode, tenantId]);

  useEffect(() => {
    const feedbackKey = searchParams.get("feedback");

    if (!feedbackKey || !(feedbackKey in feedbackMessages)) {
      return;
    }

    setSuccessMessage(feedbackMessages[feedbackKey as keyof typeof feedbackMessages]);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("feedback");
    router.replace(
      nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname,
      { scroll: false },
    );
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (mode !== "edit" || !tenantId) {
      return;
    }

    const currentTenantId = tenantId;
    let isActive = true;

    async function loadTenant() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const tenant = await getMasterTenantById(currentTenantId);

        if (!isActive) {
          return;
        }

        setPersistedTenant(tenant);
        setFormValues(buildFormValues(tenant));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(
          getApiErrorMessage(
            error,
            "Nao foi possivel carregar os dados do ambiente.",
          ),
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadTenant();

    return () => {
      isActive = false;
    };
  }, [mode, tenantId]);

  function resetSelectedLogoState() {
    setSelectedLogoFile(null);
    setLogoError(null);
    setLogoInputKey((current) => current + 1);
  }

  function handleFieldChange(field: keyof MasterTenantFormValues, value: string) {
    setSubmitError(null);
    setSuccessMessage(null);

    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSubmitError(null);
    setSuccessMessage(null);

    const file = event.target.files?.[0];

    if (!file) {
      resetSelectedLogoState();
      return;
    }

    const validationMessage = validateTenantLogoFile(file);

    if (validationMessage) {
      setSelectedLogoFile(null);
      setLogoError(validationMessage);
      event.target.value = "";
      return;
    }

    setLogoError(null);
    setSelectedLogoFile(file);
  }

  function handleUseDefaultLogo() {
    resetSelectedLogoState();
    setSubmitError(null);
    setSuccessMessage(null);
    setFormValues((current) => ({
      ...current,
      logoUrl: "",
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (logoError) {
      setSubmitError(logoError);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    let createdTenantId: string | null = null;

    try {
      if (mode === "create") {
        const payload: CreateMasterTenantPayload = {
          name: formValues.name,
          status: formValues.status,
          themeKey: formValues.themeKey,
          adminName: formValues.adminName,
          adminUsername: formValues.adminUsername,
          adminEmail: formValues.adminEmail,
          adminPassword: formValues.adminPassword,
        };

        const createdTenant = await createMasterTenant(payload);
        createdTenantId = createdTenant.id;

        if (selectedLogoFile) {
          await uploadMasterTenantLogo(
            createdTenant.id,
            selectedLogoFile,
          );
        }

        startTransition(() => {
          router.replace(
            `/master/tenants/${createdTenant.id}/editar?feedback=${
              selectedLogoFile ? "createdLogo" : "created"
            }`,
          );
          router.refresh();
        });

        return;
      } else if (tenantId) {
        const previousValues = persistedTenant
          ? {
              themeKey: persistedTenant.themeKey,
              logoUrl: persistedTenant.logoUrl ?? "",
            }
          : {
              themeKey: formValues.themeKey,
              logoUrl: formValues.logoUrl,
            };
        let logoUrl = normalizeTenantLogoUrl(formValues.logoUrl) ?? "";

        if (selectedLogoFile) {
          logoUrl = await uploadMasterTenantLogo(tenantId, selectedLogoFile);
        }

        const payload: UpdateMasterTenantPayload = {
          name: formValues.name,
          code: formValues.code,
          status: formValues.status,
          logoUrl,
          themeKey: formValues.themeKey,
        };

        const updatedTenant = await updateMasterTenant(tenantId, payload);

        setPersistedTenant(updatedTenant);
        setFormValues(buildFormValues(updatedTenant));
        resetSelectedLogoState();
        setSuccessMessage(
          getSuccessMessage(previousValues, {
            themeKey: updatedTenant.themeKey,
            logoUrl: updatedTenant.logoUrl ?? "",
          }),
        );
      }
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          createdTenantId
            ? "O ambiente foi criado, mas nao foi possivel concluir o envio da logo. Abra a edicao do ambiente para tentar novamente."
            : mode === "create"
              ? "Nao foi possivel criar o ambiente."
              : "Nao foi possivel salvar as alteracoes do ambiente.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <ErrorView
        title="Nao foi possivel carregar este ambiente"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  const isBusy = isSubmitting || isRedirecting;
  const selectedThemeLabel = getTenantThemeLabel(formValues.themeKey);
  const previewTitle = formValues.name.trim() || "Preview do ambiente";
  const previewLogoUrl =
    selectedLogoPreviewUrl ?? normalizeTenantLogoUrl(formValues.logoUrl) ?? "";
  const hasCustomLogo = Boolean(normalizeTenantLogoUrl(previewLogoUrl));

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Novo ambiente" : "Editar ambiente"}
        description={
          mode === "create"
            ? "Cadastre um novo ambiente da plataforma, escolha um tema e defina o acesso inicial."
            : "Atualize os dados principais do ambiente, incluindo tema e logo por arquivo."
        }
        badge="Plataforma"
        action={
          <Button asChild variant="outline">
            <Link href="/master/tenants">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-[color:var(--surface-soft)]">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Cadastro" : "Edicao do ambiente"}</CardTitle>
          <CardDescription>
            Dados organizados para criar e manter ambientes com consistencia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading variant="form" fields={6} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tenant-name">Nome do ambiente</Label>
                  <Input
                    id="tenant-name"
                    value={formValues.name}
                    onChange={(event) =>
                      handleFieldChange("name", event.target.value)
                    }
                    placeholder="Igreja Sede"
                    required
                  />
                </div>

                {mode === "edit" ? (
                  <div className="space-y-2">
                    <Label htmlFor="tenant-code">Codigo de acesso</Label>
                    <Input
                      id="tenant-code"
                      value={formValues.code}
                      onChange={(event) =>
                        handleFieldChange("code", event.target.value)
                      }
                      required
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Codigo usado no acesso ao ambiente. A edicao permanece restrita a plataforma.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="tenant-status">Status</Label>
                  <Select
                    id="tenant-status"
                    value={formValues.status}
                    onChange={(event) =>
                      handleFieldChange("status", event.target.value)
                    }
                  >
                    {MASTER_TENANT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant-theme">Tema do layout</Label>
                  <Select
                    id="tenant-theme"
                    value={formValues.themeKey}
                    onChange={(event) =>
                      handleFieldChange("themeKey", event.target.value)
                    }
                  >
                    {MASTER_TENANT_THEME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Tema aplicado ao ambiente. O padrao e Green.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tenant-logo-file">Logo do ambiente (opcional)</Label>
                  <Input
                    key={logoInputKey}
                    id="tenant-logo-file"
                    type="file"
                    accept={TENANT_LOGO_ACCEPT}
                    onChange={handleLogoFileChange}
                    disabled={isBusy}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-muted-foreground">
                      Envie PNG, JPG, JPEG ou WEBP com ate 1 MB. O upload da imagem sera feito ao salvar.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUseDefaultLogo}
                      disabled={isBusy}
                    >
                      Usar logo padrao
                    </Button>
                  </div>
                  {selectedLogoFile ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                      Arquivo selecionado: <strong>{selectedLogoFile.name}</strong>. Salve para aplicar ao ambiente.
                    </p>
                  ) : null}
                  {logoError ? (
                    <p className="text-xs leading-5 text-destructive">{logoError}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-secondary/25 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <BrandLogo
                    alt={`Logo do ambiente ${previewTitle}`}
                    logoUrl={previewLogoUrl}
                    className="size-[5.5rem] shrink-0 rounded-2xl border border-border bg-card shadow-sm"
                    iconClassName="size-8 text-primary"
                  />

                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{previewTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      Tema selecionado: <strong>{selectedThemeLabel}</strong>
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {selectedLogoFile
                        ? "Preview da nova logo selecionada. Salve para aplicar ao ambiente."
                        : hasCustomLogo
                          ? "Logo atual pronta para este ambiente."
                        : "Sem logo informada. O layout usara a logo padrao do sistema."}
                    </p>
                  </div>
                </div>
              </div>

              {mode === "create" ? (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
                  O codigo de acesso sera gerado automaticamente pelo sistema a
                  partir de <strong>1001</strong> e sera usado no login do
                  ambiente.
                </div>
              ) : null}

              {mode === "create" ? (
                <div className="space-y-4 rounded-3xl border border-border bg-secondary/30 p-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      Acesso inicial
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Este usuario sera criado junto com o ambiente para o primeiro acesso.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tenant-admin-name">Nome</Label>
                      <Input
                        id="tenant-admin-name"
                        value={formValues.adminName}
                        onChange={(event) =>
                          handleFieldChange("adminName", event.target.value)
                        }
                        placeholder="Administrador inicial"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant-admin-username">Usuario</Label>
                      <Input
                        id="tenant-admin-username"
                        value={formValues.adminUsername}
                        onChange={(event) =>
                          handleFieldChange("adminUsername", event.target.value)
                        }
                        placeholder="admin.local"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant-admin-email">E-mail</Label>
                      <Input
                        id="tenant-admin-email"
                        type="email"
                        value={formValues.adminEmail}
                        onChange={(event) =>
                          handleFieldChange("adminEmail", event.target.value)
                        }
                        placeholder="admin@cliente.org.br"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant-admin-password">Senha inicial</Label>
                      <Input
                        id="tenant-admin-password"
                        type="password"
                        value={formValues.adminPassword}
                        onChange={(event) =>
                          handleFieldChange("adminPassword", event.target.value)
                        }
                        placeholder="Defina uma senha inicial"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {submitError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
                  {successMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isBusy}>
                  {isBusy ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isBusy
                    ? "Salvando..."
                    : mode === "create"
                      ? "Criar ambiente"
                      : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline" disabled={isBusy}>
                  <Link href="/master/tenants">Cancelar</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
