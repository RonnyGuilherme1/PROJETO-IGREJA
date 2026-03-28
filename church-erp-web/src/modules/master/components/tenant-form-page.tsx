"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import {
  getTenantThemeLabel,
  normalizeTenantLogoUrl,
} from "@/lib/tenant-branding";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ErrorView } from "@/components/shared/error-view";
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

const AUDIT_TIMEZONE_OFFSET_IN_MS = 3 * 60 * 60 * 1000;

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

function formatAuditName(name: string | null) {
  return name?.trim() || "Nao informado";
}

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const fortalezaDate = new Date(parsed.getTime() - AUDIT_TIMEZONE_OFFSET_IN_MS);
  const day = String(fortalezaDate.getUTCDate()).padStart(2, "0");
  const month = String(fortalezaDate.getUTCMonth() + 1).padStart(2, "0");
  const year = fortalezaDate.getUTCFullYear();
  const hours = String(fortalezaDate.getUTCHours()).padStart(2, "0");
  const minutes = String(fortalezaDate.getUTCMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function TenantFormPage({ mode, tenantId }: TenantFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<MasterTenantFormValues>(initialFormValues);
  const [tenantMetadata, setTenantMetadata] = useState<MasterTenantItem | null>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedLogoPreviewUrl, setSelectedLogoPreviewUrl] = useState<
    string | null
  >(null);
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
    setSelectedLogoFile(null);
    setLogoError(null);
    setTenantMetadata(null);
  }, [mode, tenantId]);

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

        setFormValues({
          name: tenant.name,
          code: tenant.code,
          status: tenant.status || "ACTIVE",
          logoUrl: tenant.logoUrl ?? "",
          themeKey: tenant.themeKey,
          adminName: "",
          adminUsername: "",
          adminEmail: "",
          adminPassword: "",
        });
        setTenantMetadata(tenant);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(
          getApiErrorMessage(
            error,
            "Nao foi possivel carregar os dados do ambiente para edicao.",
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

  function handleFieldChange(field: keyof MasterTenantFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setLogoError(null);
      setSelectedLogoFile(null);
      return;
    }

    const normalizedMimeType = String(file.type ?? "").trim().toLowerCase();
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
      setSelectedLogoFile(null);
      setLogoError("Selecione uma imagem PNG, JPG, JPEG ou WEBP.");
      event.target.value = "";
      return;
    }

    setSubmitError(null);
    setLogoError(null);
    setSelectedLogoFile(file);
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
          logoUrl: formValues.logoUrl,
          themeKey: formValues.themeKey,
          adminName: formValues.adminName,
          adminUsername: formValues.adminUsername,
          adminEmail: formValues.adminEmail,
          adminPassword: formValues.adminPassword,
        };

        const createdTenant = await createMasterTenant(payload);
        createdTenantId = createdTenant.id;

        if (selectedLogoFile) {
          const uploadedLogoUrl = await uploadMasterTenantLogo(
            createdTenant.id,
            selectedLogoFile,
          );

          setFormValues((current) => ({
            ...current,
            logoUrl: uploadedLogoUrl,
          }));

          await updateMasterTenant(createdTenant.id, {
            logoUrl: uploadedLogoUrl,
          });
        }
      } else if (tenantId) {
        let logoUrl = formValues.logoUrl;

        if (selectedLogoFile) {
          logoUrl = await uploadMasterTenantLogo(tenantId, selectedLogoFile);
          setFormValues((current) => ({
            ...current,
            logoUrl,
          }));
        }

        const payload: UpdateMasterTenantPayload = {
          name: formValues.name,
          code: formValues.code,
          status: formValues.status,
          logoUrl,
          themeKey: formValues.themeKey,
        };

        await updateMasterTenant(tenantId, payload);
      }

      startTransition(() => {
        router.replace("/master/tenants");
        router.refresh();
      });
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
        title="Nao foi possivel abrir este ambiente"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  const selectedThemeLabel = getTenantThemeLabel(formValues.themeKey);
  const previewTitle = formValues.name.trim() || "Preview da identidade";
  const previewLogoUrl = selectedLogoPreviewUrl ?? formValues.logoUrl;
  const hasCustomLogo = Boolean(normalizeTenantLogoUrl(previewLogoUrl));

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Novo ambiente" : "Editar ambiente"}
        description={
          mode === "create"
            ? "Cadastre um novo ambiente da plataforma, escolha um tema e defina o acesso inicial."
            : "Atualize os dados principais do ambiente, incluindo logo opcional e tema exclusivo."
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
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
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
                    id="tenant-logo-file"
                    type="file"
                    accept={TENANT_LOGO_ACCEPT}
                    onChange={handleLogoFileChange}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Envie PNG, JPG, JPEG ou WEBP. O upload da imagem sera feito ao salvar.
                  </p>
                  {selectedLogoFile ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                      Arquivo selecionado: <strong>{selectedLogoFile.name}</strong>
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
                    className="h-20 w-full max-w-[12rem] shrink-0 sm:w-[12rem]"
                    iconClassName="size-9 text-primary"
                  />

                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{previewTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      Tema selecionado: <strong>{selectedThemeLabel}</strong>
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {selectedLogoFile
                        ? "Preview da nova logo selecionada. O arquivo sera enviado quando voce salvar."
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

              {mode === "edit" && tenantMetadata ? (
                <div className="grid gap-4 rounded-3xl border border-border bg-[color:var(--surface-base)] p-5 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Criado por
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatAuditName(tenantMetadata.createdByName)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Criado em {formatDateTime(tenantMetadata.createdAt)}
                    </p>
                  </div>

                  {tenantMetadata.updatedByName ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Ultima alteracao por
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {formatAuditName(tenantMetadata.updatedByName)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Atualizado em {formatDateTime(tenantMetadata.updatedAt)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Ultima alteracao
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ainda nao ha alteracoes registradas apos a criacao.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}

              {mode === "create" ? (
                <div className="space-y-4 rounded-3xl border border-border bg-[color:var(--surface-base)] p-5">
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

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting || isRedirecting}>
                  {isSubmitting || isRedirecting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {mode === "create" ? "Criar ambiente" : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline">
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
