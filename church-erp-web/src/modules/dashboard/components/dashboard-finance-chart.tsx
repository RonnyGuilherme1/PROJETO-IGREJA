"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardFinancePoint } from "@/modules/dashboard/types/dashboard";

interface DashboardFinanceChartProps {
  data: DashboardFinancePoint[];
  periodLabel: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

export function DashboardFinanceChart({
  data,
  periodLabel,
}: DashboardFinanceChartProps) {
  const chartHeight = 220;
  const chartWidth = Math.max(data.length * 96, 540);
  const bottomPadding = 36;
  const topPadding = 16;
  const innerHeight = chartHeight - bottomPadding - topPadding;
  const columnWidth = chartWidth / Math.max(data.length, 1);
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [item.income, item.expense]),
  );
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);

  return (
    <Card className="bg-white/85">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <CardTitle>Entradas x saidas por mes</CardTitle>
            <CardDescription>
              Consolidado financeiro do periodo {periodLabel}.
            </CardDescription>
          </div>
          <Badge variant="secondary">6 meses</Badge>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-700">
            <ArrowUpRight className="size-4" />
            <span>Entradas: {formatCurrency(totalIncome)}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1.5 text-rose-700">
            <ArrowDownRight className="size-4" />
            <span>Saidas: {formatCurrency(totalExpense)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="min-w-[540px]"
            role="img"
            aria-label="Grafico de barras com entradas e saidas por mes"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = topPadding + innerHeight * ratio;
              const labelValue = maxValue * (1 - ratio);

              return (
                <g key={ratio}>
                  <line
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-border"
                    strokeDasharray="4 6"
                  />
                  <text
                    x={6}
                    y={Math.max(y - 6, 10)}
                    fontSize="11"
                    className="fill-muted-foreground"
                  >
                    {formatCompactCurrency(labelValue)}
                  </text>
                </g>
              );
            })}

            {data.map((item, index) => {
              const centerX = columnWidth * index + columnWidth / 2;
              const barWidth = Math.min(24, columnWidth / 3);
              const incomeHeight = (item.income / maxValue) * innerHeight;
              const expenseHeight = (item.expense / maxValue) * innerHeight;
              const baseY = topPadding + innerHeight;

              return (
                <g key={item.monthKey}>
                  <rect
                    x={centerX - barWidth - 4}
                    y={baseY - incomeHeight}
                    width={barWidth}
                    height={incomeHeight}
                    rx="10"
                    className="fill-emerald-500/80"
                  />
                  <rect
                    x={centerX + 4}
                    y={baseY - expenseHeight}
                    width={barWidth}
                    height={expenseHeight}
                    rx="10"
                    className="fill-rose-500/80"
                  />
                  <text
                    x={centerX}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fontSize="12"
                    className="fill-muted-foreground"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
