"use client";

import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardMembersGrowthPoint } from "@/modules/dashboard/types/dashboard";

interface DashboardMembersGrowthChartProps {
  data: DashboardMembersGrowthPoint[];
  periodLabel: string;
}

function buildLinePath(
  values: DashboardMembersGrowthPoint[],
  width: number,
  height: number,
  paddingX: number,
  paddingTop: number,
  paddingBottom: number,
  maxValue: number,
) {
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;
  const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  return values
    .map((item, index) => {
      const x = paddingX + step * index;
      const y =
        paddingTop + innerHeight - (item.newMembers / maxValue) * innerHeight;

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(
  values: DashboardMembersGrowthPoint[],
  width: number,
  height: number,
  paddingX: number,
  paddingTop: number,
  paddingBottom: number,
  maxValue: number,
) {
  if (values.length === 0) {
    return "";
  }

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;
  const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;
  const baseline = paddingTop + innerHeight;
  const points = values.map((item, index) => {
    const x = paddingX + step * index;
    const y = baseline - (item.newMembers / maxValue) * innerHeight;
    return { x, y };
  });

  return [
    `M ${points[0].x} ${baseline}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1].x} ${baseline}`,
    "Z",
  ].join(" ");
}

export function DashboardMembersGrowthChart({
  data,
  periodLabel,
}: DashboardMembersGrowthChartProps) {
  const chartWidth = Math.max(data.length * 110, 540);
  const chartHeight = 220;
  const paddingX = 30;
  const paddingTop = 16;
  const paddingBottom = 34;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const maxValue = Math.max(1, ...data.map((item) => item.newMembers));
  const totalNewMembers = data.reduce((sum, item) => sum + item.newMembers, 0);
  const step = data.length > 1 ? innerWidth / (data.length - 1) : 0;
  const linePath = buildLinePath(
    data,
    chartWidth,
    chartHeight,
    paddingX,
    paddingTop,
    paddingBottom,
    maxValue,
  );
  const areaPath = buildAreaPath(
    data,
    chartWidth,
    chartHeight,
    paddingX,
    paddingTop,
    paddingBottom,
    maxValue,
  );

  return (
    <Card className="bg-white/85">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <CardTitle>Crescimento de membros por mes</CardTitle>
            <CardDescription>
              Entradas registradas no periodo {periodLabel}.
            </CardDescription>
          </div>
          <Badge variant="secondary">6 meses</Badge>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary">
          <TrendingUp className="size-4" />
          <span>{totalNewMembers} novo(s) membro(s) no periodo</span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="min-w-[540px]"
            role="img"
            aria-label="Grafico de linha com crescimento de membros por mes"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + innerHeight * ratio;
              const labelValue = Math.round(maxValue * (1 - ratio));

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
                    {labelValue}
                  </text>
                </g>
              );
            })}

            {areaPath ? <path d={areaPath} className="fill-primary/10" /> : null}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {data.map((item, index) => {
              const x = paddingX + step * index;
              const y =
                paddingTop + innerHeight - (item.newMembers / maxValue) * innerHeight;

              return (
                <g key={item.monthKey}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    className="fill-white stroke-primary"
                    strokeWidth="3"
                  />
                  <text
                    x={x}
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
