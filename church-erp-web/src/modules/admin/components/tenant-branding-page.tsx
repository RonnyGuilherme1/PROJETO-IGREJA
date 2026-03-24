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
  normalizeTenantTheme,
} from "@/lib/tenant-branding";
import {
  getCurrentTenantBranding,
  updateCurrentTenantBranding,
} from "@/modules/admin/services/tenant-branding-service";
import {
  ADMIN_TENANT_THEME_OPTIONS,
  DEFAULT_TENANT_THEME_KEY,
  type TenantBrandingFormValues,
  type TenantBrandingItem,
} from "@/modules/admin/types/tenant-branding";
import {
  AUTH_SESSION_COOKIE,
  getAuthSessionMetaFromCookie,
  getClientAccessToken,
  getCookieValue,
  persistAuthSession,
} from "@/modules/auth/lib/auth-session";
import type { AuthUser } from "@/modules/auth/types/auth";

interface TenantBrandingPageProps {
  user: AuthUser;
}

function buildTenantBrandingFromUser(user: AuthUser): TenantBrandingItem {
  return {
    id: user.tenantId?.trim() ?? "",
    name: user.tenantName?.trim() ?? "",
    code: user.tenantCode?.trim() ?? "",
    logoUrl: normalizeTenantLogoUrl(user.tenantLogoUrl),
    themeKey: normalizeTenantTheme(user.tenantThemeKey),
  };
}

function buildFormValues(tenantBranding: TenantBrandingItem): TenantBrandingFormValues {
  return {
    logoUrl: tenantBranding.logoUrl ?? "",
    themeKey: tenantBranding.themeKey ?? DEFAULT_TENANT_THEME_KEY,
  };
}

function mergeTenantBranding(
  current: TenantBrandingItem,
  incoming: TenantBrandingItem,
): TenantBrandingItem {
  return {
    id: incoming.id || current.id,
    name: incoming.name || current.name,
    code: incoming.code || current.code,
    logoUrl: incoming.logoUrl,
    themeKey: incoming.themeKey,
  };
}

export function TenantBrandingPage({ user }: TenantBrandingPageProps) {
  const router = useRouter();
  const [isRedirecting, startTransition] = useTransition();
  const [tenantBranding, setTenantBranding] = useState<TenantBrandingItem>(() =>
    buildTenantBrandingFromUser(user),
  );
  const [formValues, setFormValues] = useState<TenantBrandingFormValues>(() =>
    buildFormValues(buildTenantBrandingFromUser(user)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCurrentTenantBranding() {
      try {
        const currentTenantBranding = await getCurrentTenantBranding();

        if (!isActive) {
          return;
        }

        const mergedTenantBranding = mergeTenantBranding(
          buildTenantBrandingFromUser(user),
          currentTenantBranding,
        );

        setTenantBranding(mergedTenantBranding);
        setFormValues(buildFormValues(mergedTenantBranding));
      } catch {
        // Mantem os dados atuais da sessao quando a consulta tenant-scoped nao estiver disponivel.
      }
    }

    void loadCurrentTenantBranding();

    return () => {
      isActive = false;
    };
  }, [user]);

  function handleFieldChange(field: keyof TenantBrandingFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function syncStoredSession(nextTenantBranding: TenantBrandingItem) {
    const accessToken = getClientAccessToken();

    if (!accessToken) {
      return;
    }

    const sessionCookieValue = getCookieValue(AUTH_SESSION_COOKIE);
    const sessionMeta = getAuthSessionMetaFromCookie(sessionCookieValue);
    const baseUser = sessionMeta?.user ?? user;

    persistAuthSession({
      accessToken,
      tokenType: sessionMeta?.tokenType ?? "Bearer",
      expiresIn: sessionMeta?.expiresIn,
      user: {
        ...baseUser,
        tenantId: nextTenantBranding.id || baseUser.tenantId,
        tenantName: nextTenantBranding.name || baseUser.tenantName,
        tenantCode: nextTenantBranding.code || baseUser.tenantCode,
        tenantLogoUrl: nextTenantBranding.logoUrl,
        tenantThemeKey: nextTenantBranding.themeKey,
      },
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const updatedTenantBranding = await updateCurrentTenantBranding({
        logoUrl: formValues.logoUrl,
        themeKey: formValues.themeKey,
      });
      const nextTenantBranding = mergeTenantBranding(
        tenantBranding,
        updatedTenantBranding,
      );

      setTenantBranding(nextTenantBranding);
      setFormValues(buildFormValues(nextTenantBranding));
      syncStoredSession(nextTenantBranding);
      setSuccessMessage("Identidade visual atualizada com sucesso.");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          "Nao foi possivel salvar a identidade visual do banco.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedThemeLabel = getTenantThemeLabel(formValues.themeKey);
  const hasCustomLogo = formValues.logoUrl.trim().length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracoes"
        description="O admin do banco pode ajustar somente a identidade visual do proprio ambiente. Nome, codigo e status continuam exclusivos do fluxo master."
        badge="Acesso ADMIN"
      />

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>Identidade visual</CardTitle>
          <CardDescription>
            Ajuste somente o tema e a logo do banco atual. Quando a logo nao for informada, o sistema continua exibindo a logo padrao atual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-theme">Tema do banco</Label>
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
                <Label htmlFor="tenant-logo-url">URL da logo (opcional)</Label>
                <Input
                  id="tenant-logo-url"
                  value={formValues.logoUrl}
                  onChange={(event) =>
                    handleFieldChange("logoUrl", event.target.value)
                  }
                  placeholder="https://exemplo.com/logo.png"
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  Deixe em branco para manter a logo padrao atual do sistema.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-secondary/25 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <BrandLogo
                  alt="Logo do ambiente atual"
                  logoUrl={formValues.logoUrl}
                  className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-3xl border border-border bg-card shadow-sm"
                  imageClassName="h-full w-full bg-card p-3"
                  iconClassName="size-7 text-primary"
                />

                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    Preview do ambiente
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tema selecionado: <strong>{selectedThemeLabel}</strong>
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {hasCustomLogo
                      ? "Logo personalizada pronta para este banco."
                      : "Sem logo configurada. O sistema exibira a logo padrao atual."}
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
              <Button type="submit" disabled={isSubmitting || isRedirecting}>
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
                onClick={() => setFormValues(buildFormValues(tenantBranding))}
                disabled={isSubmitting || isRedirecting}
              >
                Descartar alteracoes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
