import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorViewProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "page" | "inline";
}

export function ErrorView({
  title,
  description,
  actionLabel = "Tentar novamente",
  onAction,
  variant = "page",
}: ErrorViewProps) {
  if (variant === "inline") {
    return (
      <div className="rounded-[24px] border border-destructive/15 bg-destructive/5 p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          {onAction ? (
            <Button type="button" variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl bg-white/85">
        <CardHeader className="space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        {onAction ? (
          <CardContent>
            <Button onClick={onAction}>{actionLabel}</Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
