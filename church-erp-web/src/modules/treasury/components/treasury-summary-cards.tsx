import { ArrowDownRight, ArrowUpRight, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TreasurySummary } from "@/modules/treasury/types/treasury";

interface TreasurySummaryCardsProps {
  summary: TreasurySummary;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function TreasurySummaryCards({ summary }: TreasurySummaryCardsProps) {
  const cards = [
    {
      title: "Entradas",
      value: formatCurrency(summary.income),
      icon: ArrowUpRight,
      iconClassName: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Saidas",
      value: formatCurrency(summary.expense),
      icon: ArrowDownRight,
      iconClassName: "bg-rose-100 text-rose-700",
    },
    {
      title: "Saldo",
      value: formatCurrency(summary.balance),
      icon: Landmark,
      iconClassName:
        summary.balance >= 0
          ? "bg-primary/10 text-primary"
          : "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
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
  );
}
