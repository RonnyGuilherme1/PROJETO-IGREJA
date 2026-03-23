"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CircleOff, Plus, ShieldCheck } from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
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
          "Nao foi possivel carregar os indicadores da area master.",
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
    const withAdmin = tenants.filter(
      (tenant) => tenant.adminUsername || tenant.adminEmail || tenant.adminName,
    ).length;

    return {
      total: tenants.length,
      active,
      inactive,
      withAdmin,
      recent: [...tenants]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    };
  }, [tenants]);

  if (error && tenants.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Falha ao carregar dashboard master"
        description={error}
        onAction={() => void loadDashboard()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard master"
        description="Visao geral da plataforma com indicadores rapidos dos tenants cadastrados."
        badge="Area master"
        action={
          <Button asChild>
            <Link href="/master/tenants/novo">
              <Plus className="size-4" />
              Novo tenant
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
        <Card className="bg-white/85">
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tenants totais</p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {summary.total}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/85">
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tenants ativos</p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {summary.active}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/85">
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tenants inativos</p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {summary.inactive}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-700">
              <CircleOff className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/85">
          <CardContent className="flex items-start justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Admins configurados</p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {summary.withAdmin}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700">
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Tenants recentes</CardTitle>
            <CardDescription>
              Ultimos ambientes identificados na area master da plataforma.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/master/tenants">
              Ver tenants
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-3xl border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary/35">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Codigo
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Admin
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
                        Nenhum tenant cadastrado ainda.
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
                        {tenant.adminName || tenant.adminUsername || tenant.adminEmail || "-"}
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
