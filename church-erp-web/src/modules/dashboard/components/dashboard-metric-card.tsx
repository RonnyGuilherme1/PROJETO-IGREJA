import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardMetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "danger";
}

const toneClasses: Record<NonNullable<DashboardMetricCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-700",
  danger: "bg-rose-500/10 text-rose-700",
};

export function DashboardMetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: DashboardMetricCardProps) {
  return (
    <Card className="bg-white/85">
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
