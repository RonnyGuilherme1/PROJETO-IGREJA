"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Landmark,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
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
import {
  getDashboardOverviewData,
  getDashboardOverviewCacheSnapshot,
  invalidateDashboardOverviewData,
  type DashboardOperationalSummary,
  type DashboardOverviewViewData,
} from "@/modules/dashboard/services/dashboard-service";

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

const panelToneClasses: Record<
  NonNullable<DashboardStatCardProps["tone"]>,
  string
> = {
  default: "border-border/60 bg-secondary/50 text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
};

interface OperationalAlertItem {
  title: string;
  description: string;
  tone: NonNullable<DashboardStatCardProps["tone"]>;
}

interface OperationalStatusItem {
  label: string;
  value: string;
  description: string;
  tone: NonNullable<DashboardStatCardProps["tone"]>;
  icon: LucideIcon;
}

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

function getMembersTrendSummary(
  series: DashboardOverviewViewData["membersGrowthSeries"],
) {
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

function getCurrentMonthLabel(label?: string) {
  return label || "mes atual";
}

function buildAttentionItems(
  metrics: DashboardOverviewViewData["metrics"],
  operational: DashboardOperationalSummary,
  currentMonthLabel: string,
): OperationalAlertItem[] {
  const items: OperationalAlertItem[] = [];

  if (
    operational.currentMonthIncome === 0 &&
    operational.currentMonthExpense === 0
  ) {
    items.push({
      title: "Financeiro sem movimento",
      description: `Nenhuma movimentacao foi registrada em ${currentMonthLabel}.`,
      tone: "default",
    });
  } else if (operational.currentMonthExpense > operational.currentMonthIncome) {
    items.push({
      title: "Saidas acima das entradas",
      description: `As despesas do mes superam as entradas em ${formatCurrency(
        operational.currentMonthExpense - operational.currentMonthIncome,
      )}.`,
      tone: "danger",
    });
  }

  if (operational.currentMonthMembers === 0) {
    items.push({
      title: "Sem novos membros no periodo",
      description: `Nao houve novos cadastros em ${currentMonthLabel}.`,
      tone: "default",
    });
  }

  if (metrics.activeUsers === 0) {
    items.push({
      title: "Sem usuarios ativos",
      description: "Nao ha usuarios ativos para sustentar a operacao do tenant.",
      tone: "danger",
    });
  } else if (
    metrics.totalChurches > 0 &&
    metrics.activeUsers < metrics.totalChurches
  ) {
    items.push({
      title: "Cobertura operacional enxuta",
      description: `${formatInteger(metrics.activeUsers)} usuarios ativos para ${formatInteger(metrics.totalChurches)} igrejas ativas.`,
      tone: "default",
    });
  }

  return items;
}

function buildOperationalStatuses(
  metrics: DashboardOverviewViewData["metrics"],
  operational: DashboardOperationalSummary,
  currentMonthLabel: string,
): OperationalStatusItem[] {
  const coverageGap = Math.max(metrics.totalChurches - metrics.activeUsers, 0);
  const financeStatus: OperationalStatusItem =
    operational.currentMonthIncome === 0 && operational.currentMonthExpense === 0
      ? {
          label: "Financeiro do mes",
          value: "Sem movimento",
          description: `Nenhuma movimentacao registrada em ${currentMonthLabel}.`,
          tone: "default",
          icon: Wallet,
        }
      : operational.currentMonthBalance < 0
        ? {
            label: "Financeiro do mes",
            value: "Em atencao",
            description: `Saldo de ${formatCurrency(operational.currentMonthBalance)} em ${currentMonthLabel}.`,
            tone: "danger",
            icon: Wallet,
          }
        : operational.currentMonthBalance === 0
          ? {
              label: "Financeiro do mes",
              value: "Equilibrado",
              description: "Entradas e saidas ficaram empatadas no mes.",
              tone: "default",
              icon: Wallet,
            }
          : {
              label: "Financeiro do mes",
              value: "Saudavel",
              description: `Saldo positivo de ${formatCurrency(operational.currentMonthBalance)} em ${currentMonthLabel}.`,
              tone: "success",
              icon: Wallet,
            };

  const membersStatus: OperationalStatusItem =
    operational.currentMonthMembers === 0
      ? {
          label: "Cadastros do mes",
          value: "Sem entrada",
          description: `Nenhum novo membro registrado em ${currentMonthLabel}.`,
          tone: "default",
          icon: UserPlus,
        }
      : operational.membersDelta > 0
        ? {
            label: "Cadastros do mes",
            value: "Acima do anterior",
            description: `+${formatInteger(operational.membersDelta)} vs. mes anterior.`,
            tone: "success",
            icon: UserPlus,
          }
        : operational.membersDelta < 0
          ? {
              label: "Cadastros do mes",
              value: "Abaixo do anterior",
              description: `${formatInteger(Math.abs(operational.membersDelta))} a menos vs. mes anterior.`,
              tone: "default",
              icon: UserPlus,
            }
          : {
              label: "Cadastros do mes",
              value: "Mesmo ritmo",
              description: "Mesmo volume de entrada do mes anterior.",
              tone: "default",
              icon: UserPlus,
            };

  const accessStatus: OperationalStatusItem =
    metrics.activeUsers === 0
      ? {
          label: "Cobertura de acesso",
          value: "Sem operadores",
          description: "Nao ha usuarios ativos no tenant.",
          tone: "danger",
          icon: ShieldCheck,
        }
      : metrics.totalChurches === 0
        ? {
            label: "Cobertura de acesso",
            value: "Sem igrejas ativas",
            description: "Nao ha igrejas ativas para comparar cobertura.",
            tone: "default",
            icon: ShieldCheck,
          }
        : metrics.activeUsers < metrics.totalChurches
          ? {
              label: "Cobertura de acesso",
              value: "Enxuta",
              description: `${formatInteger(coverageGap)} igreja(s) a mais do que usuarios ativos.`,
              tone: "default",
              icon: ShieldCheck,
            }
          : metrics.activeUsers === metrics.totalChurches
            ? {
                label: "Cobertura de acesso",
                value: "Ajustada",
                description: "Ha um usuario ativo por igreja ativa.",
                tone: "success",
                icon: ShieldCheck,
              }
            : {
                label: "Cobertura de acesso",
                value: "Confortavel",
                description: `${formatInteger(metrics.activeUsers)} usuarios ativos para ${formatInteger(metrics.totalChurches)} igrejas ativas.`,
                tone: "success",
                icon: ShieldCheck,
              };

  return [financeStatus, membersStatus, accessStatus];
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardOverviewViewData | null>(
    () => getDashboardOverviewCacheSnapshot().data ?? null,
  );
  const [isLoading, setIsLoading] = useState(
    () => !getDashboardOverviewCacheSnapshot().data,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (options?: { force?: boolean }) => {
    const snapshot = getDashboardOverviewCacheSnapshot();
    const hasVisibleData = Boolean(snapshot.data);

    if (snapshot.data) {
      setData(snapshot.data);
    }

    if (options?.force) {
      invalidateDashboardOverviewData();
      setIsRefreshing(hasVisibleData);
      setIsLoading(!hasVisibleData);
    } else if (!snapshot.isFresh) {
      setIsRefreshing(hasVisibleData);
      setIsLoading(!hasVisibleData);
    } else {
      setIsRefreshing(false);
      setIsLoading(false);
    }

    setError(null);

    try {
      const response = await getDashboardOverviewData({ force: options?.force });
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
      setIsRefreshing(false);
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
        onAction={() => void loadDashboard({ force: true })}
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
  const operational = data?.operational ?? {
    currentMonthMembers: 0,
    previousMonthMembers: 0,
    membersDelta: 0,
    currentMonthIncome: 0,
    currentMonthExpense: 0,
    currentMonthBalance: 0,
    periodIncome: 0,
    periodExpense: 0,
    periodBalance: 0,
  };
  const currentMonthLabel = getCurrentMonthLabel(data?.currentMonthLabel);
  const membersTrend = getMembersTrendSummary(data?.membersGrowthSeries ?? []);
  const MembersTrendIcon = membersTrend.icon;
  const attentionItems = buildAttentionItems(
    metrics,
    operational,
    currentMonthLabel,
  );
  const statuses = buildOperationalStatuses(
    metrics,
    operational,
    currentMonthLabel,
  );

  return (
    <div className="space-y-5">
      {isRefreshing ? (
        <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-2 text-sm text-muted-foreground">
          Atualizando indicadores do dashboard...
        </div>
      ) : null}

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

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="bg-white/85 xl:col-span-3">
          <CardHeader className="flex flex-col gap-2 pb-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Itens que precisam de atencao</CardTitle>
            <Badge variant="secondary">
              {attentionItems.length === 0
                ? "Sem pendencias"
                : `${formatInteger(attentionItems.length)} alerta(s)`}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {attentionItems.length > 0 ? (
              attentionItems.map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4",
                    panelToneClasses[item.tone],
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                      statToneClasses[item.tone],
                    )}
                  >
                    <AlertTriangle className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      Operacao sem alertas imediatos
                    </p>
                    <p className="text-sm text-emerald-800/90">
                      Os indicadores atuais nao mostram pendencias criticas para
                      o tenant neste momento.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/85 xl:col-span-2">
          <CardHeader className="flex flex-col gap-2 pb-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Leitura operacional</CardTitle>
            <Badge variant="secondary">{currentMonthLabel}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-secondary/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Membros novos no periodo
                </p>
                <Badge
                  className={membersTrend.className}
                  variant="secondary"
                >
                  <MembersTrendIcon className="mr-1 size-3.5" />
                  {membersTrend.label}
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatInteger(operational.currentMonthMembers)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {operational.previousMonthMembers > 0
                  ? `Mes anterior: ${formatInteger(operational.previousMonthMembers)}`
                  : "Sem historico anterior relevante para comparacao."}
              </p>
            </div>

            <div className="rounded-2xl bg-secondary/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Resumo financeiro do mes
                </p>
                <Badge
                  variant="secondary"
                  className={cn(
                    operational.currentMonthBalance >= 0
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-rose-500/10 text-rose-700",
                  )}
                >
                  Saldo {formatCurrency(operational.currentMonthBalance)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Entradas
                  </p>
                  <p className="mt-1 text-base font-semibold text-emerald-700">
                    {formatCurrency(operational.currentMonthIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Saidas
                  </p>
                  <p className="mt-1 text-base font-semibold text-rose-700">
                    {formatCurrency(operational.currentMonthExpense)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Acumulado
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {formatCurrency(operational.periodBalance)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {data?.financePeriodLabel
                  ? `Periodo ${data.financePeriodLabel}: ${formatCurrency(operational.periodIncome)} de entradas e ${formatCurrency(operational.periodExpense)} de saidas.`
                  : "Resumo acumulado indisponivel no momento."}
              </p>
            </div>

            <div className="space-y-3">
              {statuses.map((status) => {
                const StatusIcon = status.icon;

                return (
                  <div
                    key={status.label}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-4",
                      panelToneClasses[status.tone],
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                        statToneClasses[status.tone],
                      )}
                    >
                      <StatusIcon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{status.label}</p>
                        <Badge variant="secondary">{status.value}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {status.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
