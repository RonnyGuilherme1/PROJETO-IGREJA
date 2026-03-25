import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Landmark,
  LoaderCircle,
  Lock,
  ReceiptText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TreasurySummary } from "@/modules/treasury/types/treasury";

interface TreasurySummaryCardsProps {
  summary: TreasurySummary;
  periodLabel: string;
  closureLabel: string;
  closureDescription: string;
  isClosureLoading: boolean;
  isMonthClosed: boolean;
  showCloseAction: boolean;
  canCloseMonth: boolean;
  isClosingMonth: boolean;
  isExporting: boolean;
  onCloseMonth: () => void;
  onExport: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function TreasurySummaryCards({
  summary,
  periodLabel,
  closureLabel,
  closureDescription,
  isClosureLoading,
  isMonthClosed,
  showCloseAction,
  canCloseMonth,
  isClosingMonth,
  isExporting,
  onCloseMonth,
  onExport,
}: TreasurySummaryCardsProps) {
  const cards = [
    {
      title: `Entradas ${periodLabel}`,
      value: formatCurrency(summary.income),
      icon: ArrowUpRight,
      iconClassName: "bg-emerald-100 text-emerald-700",
    },
    {
      title: `Saidas ${periodLabel}`,
      value: formatCurrency(summary.expense),
      icon: ArrowDownRight,
      iconClassName: "bg-rose-100 text-rose-700",
    },
    {
      title: `Saldo ${periodLabel}`,
      value: formatCurrency(summary.balance),
      icon: Landmark,
      iconClassName:
        summary.balance >= 0
          ? "bg-primary/10 text-primary"
          : "bg-amber-100 text-amber-700",
    },
    {
      title: "Lancamentos",
      value: String(summary.transactionCount),
      icon: ReceiptText,
      iconClassName: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">Fechamento mensal</CardTitle>
              <Badge variant={isMonthClosed ? "secondary" : "outline"}>
                {isClosureLoading ? "Consultando" : closureLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{closureDescription}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Exportar CSV
            </Button>

            {showCloseAction ? (
              <Button
                type="button"
                onClick={onCloseMonth}
                disabled={isMonthClosed || !canCloseMonth || isClosingMonth}
              >
                {isClosingMonth ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Lock className="size-4" />
                )}
                {isMonthClosed ? "Mes fechado" : "Fechar mes"}
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="bg-white/85">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div
                  className={`flex size-10 items-center justify-center rounded-2xl ${card.iconClassName}`}
                >
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {card.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
