"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CreditCard,
  Landmark,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ErrorView } from "@/components/shared/error-view";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/http";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardFinanceChart } from "@/modules/dashboard/components/dashboard-finance-chart";
import { DashboardOverviewSkeleton } from "@/modules/dashboard/components/dashboard-overview-skeleton";
import { getDashboardOverviewData } from "@/modules/dashboard/services/dashboard-service";
import type { DashboardOverviewData } from "@/modules/dashboard/types/dashboard";

interface DashboardStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "danger";
  footer?: ReactNode;
}

const statToneClasses: Record<
  NonNullable<DashboardStatCardProps["tone"]>,
  string
> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-700",
  danger: "bg-rose-500/10 text-rose-700",
};

function DashboardStatCard({
  title,
  value,
  icon: Icon,
  tone = "default",
  footer,
}: DashboardStatCardProps) {
  return (
    <Card className="bg-white/85">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          {footer}
        </div>

        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            statToneClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

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

function getMembersTrendSummary(series: DashboardOverviewData["membersGrowthSeries"]) {
  const currentPoint = series[series.length - 1];
  const previousPoint = series[series.length - 2];

  if (!currentPoint || !previousPoint) {
    return {
      icon: ArrowRight,
      label: "Sem comparativo",
      className: "bg-secondary text-foreground",
    };
  }

  const delta = currentPoint.newMembers - previousPoint.newMembers;

  if (delta > 0) {
    return {
      icon: ArrowUpRight,
      label: `+${formatInteger(delta)} vs. mes anterior`,
      className: "bg-emerald-500/10 text-emerald-700",
    };
  }

  if (delta < 0) {
    return {
      icon: ArrowDownRight,
      label: `-${formatInteger(Math.abs(delta))} vs. mes anterior`,
      className: "bg-rose-500/10 text-rose-700",
    };
  }

  return {
    icon: ArrowRight,
    label: "Mesmo nivel do mes anterior",
    className: "bg-secondary text-foreground",
  };
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
        title="Nao foi possivel abrir o dashboard"
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
  };
  const membersTrend = getMembersTrendSummary(data?.membersGrowthSeries ?? []);
  const MembersTrendIcon = membersTrend.icon;

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          title="Total de membros"
          value={formatInteger(metrics.totalMembers)}
          icon={Users}
          footer={
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                membersTrend.className,
              )}
            >
              <MembersTrendIcon className="size-4" />
              <span>{membersTrend.label}</span>
            </div>
          }
        />
        <DashboardStatCard
          title="Total de igrejas"
          value={formatInteger(metrics.totalChurches)}
          icon={Building2}
        />
        <DashboardStatCard
          title={`Entradas de ${data?.currentMonthLabel || "mes atual"}`}
          value={formatCurrency(metrics.monthlyIncome)}
          icon={TrendingUp}
          tone="success"
        />
        <DashboardStatCard
          title={`Saidas de ${data?.currentMonthLabel || "mes atual"}`}
          value={formatCurrency(metrics.monthlyExpense)}
          icon={TrendingDown}
          tone="danger"
        />
        <DashboardStatCard
          title="Saldo do mes"
          value={formatCurrency(metrics.monthlyBalance)}
          icon={Landmark}
          tone={metrics.monthlyBalance >= 0 ? "success" : "danger"}
        />
        <DashboardStatCard
          title="Usuarios ativos"
          value={formatInteger(metrics.activeUsers)}
          icon={CreditCard}
        />
      </div>

      <DashboardFinanceChart
        data={data?.financeSeries ?? []}
        periodLabel={data?.financePeriodLabel ?? ""}
      />

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-2 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Resumo do periodo</CardTitle>
          </div>
          <Badge variant="secondary">{data?.financePeriodLabel}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Entradas
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatCurrency(totals.periodIncome)}
            </p>
          </div>
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Saidas
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatCurrency(totals.periodExpense)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
