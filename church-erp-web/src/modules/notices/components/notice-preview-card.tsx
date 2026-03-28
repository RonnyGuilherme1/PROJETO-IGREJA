"use client";

import { useState } from "react";
import { Copy, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NoticeStatus } from "@/modules/notices/types/notices";

interface NoticePreviewCardProps {
  title: string;
  message: string;
  imageUrl: string;
  targetLabel: string;
  scheduledAt: string;
  status: NoticeStatus;
  churchName?: string | null;
}

function formatDateTime(value: string) {
  if (!value) {
    return "Nao agendado";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function getStatusLabel(status: NoticeStatus) {
  switch (status) {
    case "READY":
      return "Pronto";
    case "SENT":
      return "Enviado";
    default:
      return "Rascunho";
  }
}

export function NoticePreviewCard({
  title,
  message,
  imageUrl,
  targetLabel,
  scheduledAt,
  status,
  churchName,
}: NoticePreviewCardProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const hasPreviewImage = Boolean(imageUrl) && imageUrl !== failedImageUrl;

  async function handleCopyMessage() {
    if (!message.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(message.trim());
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <Card className="bg-white/85">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle>Preview do aviso</CardTitle>
            <CardDescription>
              Visualizacao manual da mensagem sem envio automatico.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopyMessage()}
            disabled={!message.trim()}
          >
            <Copy className="size-4" />
            {copyStatus === "success"
              ? "Mensagem copiada"
              : copyStatus === "error"
                ? "Falha ao copiar"
                : "Copiar mensagem"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-3xl border border-border bg-secondary/20">
          {hasPreviewImage ? (
            <img
              src={imageUrl}
              alt={title || "Preview do aviso"}
              className="h-52 w-full object-cover"
              onError={() => setFailedImageUrl(imageUrl)}
            />
          ) : (
            <div className="flex h-52 flex-col items-center justify-center gap-3 text-muted-foreground">
              <ImageOff className="size-8" />
              <p className="text-sm">
                {imageUrl ? "Nao foi possivel carregar a imagem." : "Sem imagem para este aviso."}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-3xl border border-border bg-white p-5">
          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              {getStatusLabel(status)}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {churchName || "Geral"}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {targetLabel.trim() || "Publico geral"}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {title.trim() || "Titulo do aviso"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Agendamento: {formatDateTime(scheduledAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/20 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {message.trim() || "A mensagem aparecera aqui conforme voce preencher o formulario."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
