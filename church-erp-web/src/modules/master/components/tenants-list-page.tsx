"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Pencil, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
import { DEFAULT_TENANT_THEME_KEY, getTenantThemeLabel } from "@/lib/tenant-branding";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ErrorView } from "@/components/shared/error-view";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMasterAccessLabel } from "@/modules/master/lib/master-access";
import {
  activateMasterTenant,
  inactivateMasterTenant,
  listMasterTenants,
} from "@/modules/master/services/master-tenants-service";
import type { MasterTenantItem } from "@/modules/master/types/tenant";

const AUDIT_TIMEZONE_OFFSET_IN_MS = 3 * 60 * 60 * 1000;

function isInactive(status: MasterTenantItem["status"]) {
  return status === "INACTIVE";
}

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

export function TenantsListPage() {
  const [tenants, setTenants] = useState<MasterTenantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tenantPendingStatusChange, setTenantPendingStatusChange] =
    useState<MasterTenantItem | null>(null);
  const customLogoCount = tenants.filter((tenant) => Boolean(tenant.logoUrl)).length;
  const customThemeCount = tenants.filter(
    (tenant) => tenant.themeKey !== DEFAULT_TENANT_THEME_KEY,
  ).length;

  const loadTenants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listMasterTenants();
      setTenants(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar a lista de ambientes.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  function handleToggleStatus(tenant: MasterTenantItem) {
    setTenantPendingStatusChange(tenant);
  }

  async function confirmToggleStatus() {
    if (!tenantPendingStatusChange) {
      return;
    }

    const isInactive = tenantPendingStatusChange.status.toUpperCase() === "INACTIVE";

    setTogglingId(tenantPendingStatusChange.id);
    setError(null);

    try {
      if (isInactive) {
        await activateMasterTenant(tenantPendingStatusChange.id);
      } else {
        await inactivateMasterTenant(tenantPendingStatusChange.id);
      }

      await loadTenants();
      setTenantPendingStatusChange(null);
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          `Nao foi possivel ${isInactive ? "ativar" : "inativar"} o ambiente selecionado.`,
        ),
      );
    } finally {
      setTogglingId(null);
    }
  }

  if (error && tenants.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel abrir os ambientes"
        description={error}
        onAction={() => void loadTenants()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ambientes"
        description="Gerencie os ambientes da plataforma, atualize dados cadastrais e controle a ativacao."
        badge={getMasterAccessLabel()}
        action={
          <Button asChild>
            <Link href="/master/tenants/novo">
              <Plus className="size-4" />
              Novo ambiente
            </Link>
          </Button>
        }
      />

      <Card className="bg-[color:var(--surface-soft)]">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Visao geral</CardTitle>
            <CardDescription>
              Panorama rapido da base de ambientes e da identidade visual aplicada em cada operacao.
            </CardDescription>
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-[color:var(--surface-base)] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Ambientes
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {total}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ambientes cadastrados com codigo, status e identidade visual.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-[color:var(--surface-base)] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Logo propria
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {customLogoCount}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ambientes com marca personalizada aplicada no painel e login.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-[color:var(--surface-base)] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Tema customizado
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {customThemeCount}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ambientes com tema visual diferente do padrao principal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[color:var(--surface-soft)]">
        <CardHeader className="space-y-2">
          <CardTitle>Listagem</CardTitle>
          <CardDescription>
            Visualize ambientes, acompanhe a auditoria operacional e acione edicao ou troca de status com leitura mais limpa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-3xl border border-border bg-[color:var(--surface-base)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary/35">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Ambiente
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Auditoria
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading && tenants.length === 0
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4" colSpan={4}>
                            <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                          </td>
                        </tr>
                      ))
                    : null}

                  {!isLoading && tenants.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-14 text-center text-sm text-muted-foreground"
                      >
                        Nenhum ambiente encontrado na plataforma.
                      </td>
                    </tr>
                  ) : null}

                  {tenants.map((tenant) => {
                    const inactive = isInactive(tenant.status);
                    const rowLoading = togglingId === tenant.id;
                    const hasAuditUpdate = Boolean(tenant.updatedByName);

                    return (
                      <tr key={tenant.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <BrandLogo
                              alt={`Logo do ambiente ${tenant.name}`}
                              logoUrl={tenant.logoUrl}
                              className="size-14 shrink-0 rounded-2xl border border-border bg-card shadow-sm"
                              iconClassName="size-6 text-primary"
                            />

                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{tenant.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Codigo {tenant.code || "-"}
                              </p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <Badge variant="secondary">
                                  {getTenantThemeLabel(tenant.themeKey)}
                                </Badge>
                                <Badge variant="outline" className="bg-card">
                                  {tenant.logoUrl ? "Logo propria" : "Logo padrao"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-3 text-sm">
                            <div className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                Criado por
                              </p>
                              <p className="text-muted-foreground">
                                {formatAuditName(tenant.createdByName)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Criado em {formatDateTime(tenant.createdAt)}
                              </p>
                            </div>

                            {hasAuditUpdate ? (
                              <div className="space-y-1 border-t border-border/70 pt-3">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                  Ultima alteracao por
                                </p>
                                <p className="text-muted-foreground">
                                  {formatAuditName(tenant.updatedByName)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Atualizado em {formatDateTime(tenant.updatedAt)}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={inactive ? "outline" : "secondary"}>
                            {inactive ? "Inativo" : "Ativo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col justify-end gap-2 sm:flex-row">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/master/tenants/${tenant.id}/editar`}>
                                <Pencil className="size-4" />
                                Editar
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant={inactive ? "secondary" : "destructive"}
                              size="sm"
                              onClick={() => void handleToggleStatus(tenant)}
                              disabled={rowLoading}
                            >
                              {rowLoading ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : inactive ? (
                                <ToggleRight className="size-4" />
                              ) : (
                                <ToggleLeft className="size-4" />
                              )}
                              {inactive ? "Ativar" : "Inativar"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(tenantPendingStatusChange)}
        title={
          tenantPendingStatusChange?.status === "INACTIVE"
            ? "Ativar ambiente"
            : "Inativar ambiente"
        }
        description={
          tenantPendingStatusChange
            ? tenantPendingStatusChange.status === "INACTIVE"
              ? `O ambiente ${tenantPendingStatusChange.name} voltara a ficar disponivel para acesso.`
              : `O ambiente ${tenantPendingStatusChange.name} deixara de ficar disponivel para acesso ate nova ativacao.`
            : ""
        }
        confirmLabel={
          tenantPendingStatusChange?.status === "INACTIVE" ? "Ativar" : "Inativar"
        }
        confirmVariant={
          tenantPendingStatusChange?.status === "INACTIVE"
            ? "secondary"
            : "destructive"
        }
        isLoading={Boolean(
          tenantPendingStatusChange &&
            togglingId === tenantPendingStatusChange.id,
        )}
        onConfirm={() => void confirmToggleStatus()}
        onOpenChange={(open) => {
          if (!open) {
            setTenantPendingStatusChange(null);
          }
        }}
      />
    </div>
  );
}
