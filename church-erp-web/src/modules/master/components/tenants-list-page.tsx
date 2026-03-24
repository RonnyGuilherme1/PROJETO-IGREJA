"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
import { DEFAULT_TENANT_THEME_KEY } from "@/lib/tenant-branding";
import { ErrorView } from "@/components/shared/error-view";
import { PageHeader } from "@/components/shared/page-header";
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
          "Nao foi possivel carregar a listagem de bancos.",
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
    const isInactive = tenant.status.toUpperCase() === "INACTIVE";
    const confirmed = window.confirm(
      isInactive
        ? `Deseja ativar o banco ${tenant.name}?`
        : `Deseja inativar o banco ${tenant.name}?`,
    );

    if (!confirmed) {
      return;
    }

    setTogglingId(tenant.id);
    setError(null);

    try {
      if (isInactive) {
        await activateMasterTenant(tenant.id);
      } else {
        await inactivateMasterTenant(tenant.id);
      }

      await loadTenants();
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          `Nao foi possivel ${isInactive ? "ativar" : "inativar"} o banco selecionado.`,
        ),
      );
    } finally {
      setTogglingId(null);
    }
  }

  if (error && tenants.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Falha ao carregar bancos"
        description={error}
        onAction={() => void loadTenants()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bancos"
        description="Gerencie os bancos da plataforma, atualize dados cadastrais e controle a ativacao dos ambientes."
        badge={getMasterAccessLabel()}
        action={
          <Button asChild>
            <Link href="/master/tenants/novo">
              <Plus className="size-4" />
              Novo banco
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Listagem</CardTitle>
            <CardDescription>
              Bancos cadastrados com acoes de edicao, ativacao e identidade visual por ambiente.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="secondary">{total} banco(s)</Badge>
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
    </div>
  );
}
