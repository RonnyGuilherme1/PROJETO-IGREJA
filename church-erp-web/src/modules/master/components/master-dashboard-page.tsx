"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CircleOff, ImageIcon, Plus, ShieldCheck } from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
import { getTenantThemeLabel } from "@/lib/tenant-branding";
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
import { listMasterTenants } from "@/modules/master/services/master-tenants-service";
import type { MasterTenantItem } from "@/modules/master/types/tenant";

function isInactive(status: string) {
  return status.toUpperCase() === "INACTIVE";
}

export function MasterDashboardPage() {
  const [tenants, setTenants] = useState<MasterTenantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listMasterTenants();
      setTenants(response.items);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar os indicadores da plataforma.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const summary = useMemo(() => {
    const active = tenants.filter((tenant) => !isInactive(tenant.status)).length;
    const inactive = tenants.length - active;
    const withCustomLogo = tenants.filter((tenant) => Boolean(tenant.logoUrl)).length;

    return {
      total: tenants.length,
      active,
      inactive,
      withCustomLogo,
      recent: [...tenants]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    };
  }, [tenants]);

  if (error && tenants.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel abrir a visao da plataforma"
        description={error}
        onAction={() => void loadDashboard()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard da plataforma"
        description="Acompanhe os principais indicadores dos ambientes cadastrados."
        badge="Plataforma"
        action={
          <Button asChild>
            <Link href="/master/tenants/novo">
              <Plus className="size-4" />
              Novo ambiente
            </Link>
          </Button>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-[color:var(--surface-soft)]">
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ambientes totais</p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {summary.total}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--surface-soft)]">
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ambientes ativos</p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {summary.active}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--surface-soft)]">
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ambientes inativos</p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {summary.inactive}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/12 text-destructive">
              <CircleOff className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--surface-soft)]">
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Logos customizadas</p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {summary.withCustomLogo}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <ImageIcon className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[color:var(--surface-soft)]">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Ambientes recentes</CardTitle>
            <CardDescription>
              Ultimos ambientes cadastrados na plataforma.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/master/tenants">
              Ver ambientes
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-3xl border border-border bg-[color:var(--surface-base)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary/35">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Ambiente
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Codigo
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Tema
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading && tenants.length === 0
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4" colSpan={4}>
                            <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                          </td>
                        </tr>
                      ))
                    : null}

                  {!isLoading && summary.recent.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-14 text-center text-sm text-muted-foreground"
                      >
                        Nenhum ambiente cadastrado ainda.
                      </td>
                    </tr>
                  ) : null}

                  {summary.recent.map((tenant) => (
                    <tr key={tenant.id}>
                      <td className="px-4 py-4 font-medium text-foreground">
                        {tenant.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {tenant.code || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {getTenantThemeLabel(tenant.themeKey)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={isInactive(tenant.status) ? "outline" : "secondary"}
                        >
                          {isInactive(tenant.status) ? "Inativo" : "Ativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
