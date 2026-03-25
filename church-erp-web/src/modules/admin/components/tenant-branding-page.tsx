"use client";

import { useEffect, useState, useTransition } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
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
import { getApiErrorMessage } from "@/lib/http";
import {
  getTenantThemeLabel,
  normalizeTenantLogoUrl,
} from "@/lib/tenant-branding";
import {
  getCurrentTenantBranding,
  uploadCurrentTenantLogo,
  updateCurrentTenantBranding,
} from "@/modules/admin/services/tenant-branding-service";
import {
  ADMIN_TENANT_THEME_OPTIONS,
  DEFAULT_TENANT_THEME_KEY,
  type TenantBrandingFormValues,
  type TenantBrandingItem,
} from "@/modules/admin/types/tenant-branding";
import {
  getClientAccessToken,
  persistAuthSession,
} from "@/modules/auth/lib/auth-session";
import type { AuthUser } from "@/modules/auth/types/auth";

interface TenantBrandingPageProps {
  user: AuthUser;
}

const TENANT_LOGO_MAX_FILE_SIZE = 1024 * 1024;
const TENANT_LOGO_INPUT_ACCEPT = ".png,.jpg,.jpeg,.webp";
const TENANT_LOGO_ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const TENANT_LOGO_ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function buildFormValues(tenantBranding: TenantBrandingItem): TenantBrandingFormValues {
  return {
    logoUrl: tenantBranding.logoUrl ?? "",
    themeKey: tenantBranding.themeKey ?? DEFAULT_TENANT_THEME_KEY,
  };
}

function validateTenantLogoFile(file: File): string | null {
  if (file.size > TENANT_LOGO_MAX_FILE_SIZE) {
    return "A logo do ambiente deve ter no maximo 1 MB.";
  }

  const normalizedMimeType = file.type.trim().toLowerCase();
  const normalizedName = file.name.trim().toLowerCase();
  const hasAllowedMimeType =
    normalizedMimeType.length > 0 &&
    TENANT_LOGO_ALLOWED_MIME_TYPES.has(normalizedMimeType);
  const hasAllowedExtension = TENANT_LOGO_ALLOWED_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );

  if (
    (normalizedMimeType && !hasAllowedMimeType) ||
    (!normalizedMimeType && !hasAllowedExtension) ||
    !hasAllowedExtension
  ) {
    return "Selecione uma imagem PNG, JPG, JPEG ou WEBP.";
  }

  return null;
}

export function TenantBrandingPage({ user }: TenantBrandingPageProps) {
  const router = useRouter();
  const [isRedirecting, startTransition] = useTransition();
  const [tenantBranding, setTenantBranding] = useState<TenantBrandingItem | null>(
    null,
  );
  const [formValues, setFormValues] = useState<TenantBrandingFormValues>({
    logoUrl: "",
    themeKey: DEFAULT_TENANT_THEME_KEY,
  });
  const [isLoadingBranding, setIsLoadingBranding] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedLogoPreviewUrl, setSelectedLogoPreviewUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoInputKey, setLogoInputKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadCurrentTenantBranding() {
      setIsLoadingBranding(true);

      try {
        const currentTenantBranding = await getCurrentTenantBranding();

        if (!isActive) {
          return;
        }

        setLoadError(null);
        setTenantBranding(currentTenantBranding);
        setFormValues(buildFormValues(currentTenantBranding));
      } catch (error) {
        if (isActive) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Nao foi possivel carregar a identidade visual deste ambiente.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingBranding(false);
        }
      }
    }

    void loadCurrentTenantBranding();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (selectedLogoPreviewUrl) {
        URL.revokeObjectURL(selectedLogoPreviewUrl);
      }
    };
  }, [selectedLogoPreviewUrl]);

  function handleFieldChange(field: keyof TenantBrandingFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetSelectedLogoState() {
    setSelectedLogoFile(null);
    setLogoError(null);
    setLogoInputKey((current) => current + 1);
    setSelectedLogoPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });
  }

  function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSubmitError(null);
    setSuccessMessage(null);

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationMessage = validateTenantLogoFile(file);

    if (validationMessage) {
      setLogoError(validationMessage);
      event.target.value = "";
      return;
    }

    setSelectedLogoFile(file);
    setLogoError(null);
    setSelectedLogoPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return URL.createObjectURL(file);
    });
  }

  function handleUseDefaultLogo() {
    resetSelectedLogoState();
    setFormValues((current) => ({
      ...current,
      logoUrl: "",
    }));
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function handleDiscardChanges() {
    if (!tenantBranding) {
      return;
    }

    setFormValues(buildFormValues(tenantBranding));
    resetSelectedLogoState();
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function syncStoredSession(nextTenantBranding: TenantBrandingItem) {
    const accessToken = getClientAccessToken();

    if (!accessToken) {
      return;
    }

    const baseUser = user;

    persistAuthSession({
      accessToken,
      user: {
        ...baseUser,
        tenantId: nextTenantBranding.id || baseUser.tenantId,
        tenantName: nextTenantBranding.name || baseUser.tenantName,
        tenantCode: nextTenantBranding.code || baseUser.tenantCode,
        tenantLogoUrl: nextTenantBranding.logoUrl,
        tenantThemeKey: nextTenantBranding.themeKey,
        tenant: nextTenantBranding.id
          ? {
              id: nextTenantBranding.id,
              name: nextTenantBranding.name,
              code: nextTenantBranding.code,
              logoUrl: nextTenantBranding.logoUrl,
              themeKey: nextTenantBranding.themeKey,
            }
          : null,
      },
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (!tenantBranding) {
        throw new Error(
          "A identidade visual atual precisa ser carregada antes de salvar.",
        );
      }

      let nextLogoUrl = formValues.logoUrl;

      if (selectedLogoFile) {
        const uploadResult = await uploadCurrentTenantLogo(selectedLogoFile);
        nextLogoUrl = uploadResult.logoUrl;
      }

      const updatedTenantBranding = await updateCurrentTenantBranding({
        logoUrl: nextLogoUrl,
        themeKey: formValues.themeKey,
      });
      const nextTenantBranding = updatedTenantBranding;

      setTenantBranding(nextTenantBranding);
      setFormValues(buildFormValues(nextTenantBranding));
      resetSelectedLogoState();
      syncStoredSession(nextTenantBranding);
      setSuccessMessage("Identidade visual atualizada com sucesso.");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          "Nao foi possivel salvar a identidade visual do ambiente.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedThemeLabel = getTenantThemeLabel(formValues.themeKey);
  const previewLogoUrl = selectedLogoPreviewUrl ?? formValues.logoUrl;
  const hasCustomLogo = Boolean(normalizeTenantLogoUrl(previewLogoUrl));
  const hasPersistedCustomLogo = Boolean(normalizeTenantLogoUrl(formValues.logoUrl));
  const previewLogoMessage = selectedLogoFile
    ? "Preview pronto. Salve para enviar a nova logo deste ambiente."
    : hasPersistedCustomLogo
      ? "Logo personalizada configurada para este ambiente."
      : hasCustomLogo
        ? "Logo personalizada pronta para este ambiente."
        : "Sem logo configurada. O sistema exibira a logo padrao atual.";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracoes"
        description="Ajuste o tema e a identidade visual do ambiente sem alterar as configuracoes de acesso."
        badge="Administrador"
      />

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>Identidade visual</CardTitle>
          <CardDescription>
            Ajuste somente o tema e a logo do ambiente atual. Quando a logo nao for informada, o sistema continua exibindo a marca padrao.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBranding && !tenantBranding ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {loadError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {loadError}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-theme">Tema do ambiente</Label>
                <Select
                  id="tenant-theme"
                  value={formValues.themeKey}
                  onChange={(event) =>
                    handleFieldChange("themeKey", event.target.value)
                  }
                >
                  {ADMIN_TENANT_THEME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs leading-5 text-muted-foreground">
                  O valor padrao continua sendo <strong>Green</strong>.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tenant-logo-file">Logo do ambiente (opcional)</Label>
                <Input
                  key={logoInputKey}
                  id="tenant-logo-file"
                  type="file"
                  accept={TENANT_LOGO_INPUT_ACCEPT}
                  onChange={handleLogoFileChange}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Aceita PNG, JPG, JPEG ou WEBP com ate 1 MB. Se nao houver logo configurada, o sistema continua exibindo a logo padrao atual.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseDefaultLogo}
                    disabled={isSubmitting || isRedirecting}
                  >
                    Usar logo padrao
                  </Button>
                </div>
                {selectedLogoFile ? (
                  <p className="text-xs leading-5 text-primary">
                    Arquivo selecionado: <strong>{selectedLogoFile.name}</strong>. Salve para aplicar ao ambiente.
                  </p>
                ) : null}
                {logoError ? (
                  <p className="text-sm text-destructive">{logoError}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-secondary/25 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <BrandLogo
                  alt="Logo do ambiente atual"
                  logoUrl={previewLogoUrl}
                  className="size-[5.5rem] shrink-0 rounded-2xl border border-border bg-card shadow-sm"
                  iconClassName="size-8 text-primary"
                />

                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    Preview do ambiente
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tema selecionado: <strong>{selectedThemeLabel}</strong>
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {previewLogoMessage}
                  </p>
                </div>
              </div>
            </div>

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
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  isRedirecting ||
                  isLoadingBranding ||
                  !tenantBranding
                }
              >
                {isSubmitting || isRedirecting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Salvar configuracoes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscardChanges}
                disabled={
                  isSubmitting ||
                  isRedirecting ||
                  isLoadingBranding ||
                  !tenantBranding
                }
              >
                Descartar alteracoes
              </Button>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
