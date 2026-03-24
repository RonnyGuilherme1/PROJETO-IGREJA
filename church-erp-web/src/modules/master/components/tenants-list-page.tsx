"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
import { DEFAULT_TENANT_THEME_KEY } from "@/lib/tenant-branding";
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
import { TenantsTable } from "@/modules/master/components/tenants-table";
import type { MasterTenantItem } from "@/modules/master/types/tenant";

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

  async function handleToggleStatus(tenant: MasterTenantItem) {
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

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Listagem</CardTitle>
            <CardDescription>
              Ambientes cadastrados com acoes de edicao, ativacao e identidade visual.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="secondary">Total: {total}</Badge>
            <Badge variant="outline">{customLogoCount} com logo propria</Badge>
            <Badge variant="outline">{customThemeCount} com tema customizado</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <TenantsTable
            tenants={tenants}
            isLoading={isLoading}
            togglingId={togglingId}
            onToggleStatus={handleToggleStatus}
          />
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
