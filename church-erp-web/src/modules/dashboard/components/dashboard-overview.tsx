"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  Landmark,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { ErrorView } from "@/components/shared/error-view";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/http";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardFinanceChart } from "@/modules/dashboard/components/dashboard-finance-chart";
import { DashboardMembersGrowthChart } from "@/modules/dashboard/components/dashboard-members-growth-chart";
import { DashboardMetricCard } from "@/modules/dashboard/components/dashboard-metric-card";
import { DashboardOverviewSkeleton } from "@/modules/dashboard/components/dashboard-overview-skeleton";
import { getDashboardOverviewData } from "@/modules/dashboard/services/dashboard-service";
import type { DashboardOverviewData } from "@/modules/dashboard/types/dashboard";

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getDashboardOverviewData();
      setData(response);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar os dados do dashboard.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (error && !data && !isLoading) {
    return (
      <ErrorView
        title="Falha ao carregar dashboard"
        description={error}
        onAction={() => void loadDashboard()}
      />
    );
  }

  if (isLoading && !data) {
    return <DashboardOverviewSkeleton />;
  }

  const metrics = data?.metrics ?? {
    totalMembers: 0,
    totalChurches: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyBalance: 0,
    activeUsers: 0,
  };
  const totals = {
    periodIncome: (data?.financeSeries ?? []).reduce(
      (sum, item) => sum + item.income,
      0,
    ),
    periodExpense: (data?.financeSeries ?? []).reduce(
      (sum, item) => sum + item.expense,
      0,
    ),
    periodMembers: (data?.membersGrowthSeries ?? []).reduce(
      (sum, item) => sum + item.newMembers,
      0,
    ),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Acompanhe os principais indicadores do ERP com visao consolidada de membros, igrejas, tesouraria e usuarios."
        badge="Visao geral"
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardMetricCard
          title="Total de membros"
          value={formatInteger(metrics.totalMembers)}
          description="Cadastros de membros retornados pela API."
          icon={Users}
        />
        <DashboardMetricCard
          title="Total de igrejas"
          value={formatInteger(metrics.totalChurches)}
          description="Igrejas registradas para operacao no sistema."
          icon={Building2}
        />
        <DashboardMetricCard
          title={`Entradas de ${data?.currentMonthLabel || "mes atual"}`}
          value={formatCurrency(metrics.monthlyIncome)}
          description="Receitas consolidadas no mes corrente."
          icon={TrendingUp}
          tone="success"
        />
        <DashboardMetricCard
          title={`Saidas de ${data?.currentMonthLabel || "mes atual"}`}
          value={formatCurrency(metrics.monthlyExpense)}
          description="Despesas consolidadas no mes corrente."
          icon={TrendingDown}
          tone="danger"
        />
        <DashboardMetricCard
          title="Saldo do mes"
          value={formatCurrency(metrics.monthlyBalance)}
          description="Resultado entre entradas e saidas no periodo atual."
          icon={Landmark}
          tone={metrics.monthlyBalance >= 0 ? "success" : "danger"}
        />
        <DashboardMetricCard
          title="Usuarios ativos"
          value={formatInteger(metrics.activeUsers)}
          description="Usuarios com acesso interno ativo."
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardFinanceChart
          data={data?.financeSeries ?? []}
          periodLabel={data?.financePeriodLabel ?? ""}
        />
        <DashboardMembersGrowthChart
          data={data?.membersGrowthSeries ?? []}
          periodLabel={data?.membersPeriodLabel ?? ""}
        />
      </div>

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <CardTitle>Leitura rapida do periodo</CardTitle>
          </div>
          <Badge variant="secondary">{data?.financePeriodLabel}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Entradas no periodo
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatCurrency(totals.periodIncome)}
            </p>
          </div>
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Saidas no periodo
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatCurrency(totals.periodExpense)}
            </p>
          </div>
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Novos membros no periodo
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatInteger(totals.periodMembers)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
