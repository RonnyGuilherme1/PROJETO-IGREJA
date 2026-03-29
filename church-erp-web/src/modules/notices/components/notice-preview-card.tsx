"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, ImageOff, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/http";
import { normalizeTenantLogoUrl } from "@/lib/tenant-branding";
import { getWhatsappIntegrationStatus } from "@/modules/notice-delivery/services/whatsapp-delivery-service";
import type { WhatsappIntegrationStatusItem } from "@/modules/notice-delivery/types/whatsapp-delivery";
import type { NoticeStatus } from "@/modules/notices/types/notices";

interface NoticePreviewCardProps {
  title: string;
  message: string;
  imageUrl: string;
  targetLabel: string;
  scheduledAt: string;
  status: NoticeStatus;
  churchName?: string | null;
  imageMessage?: string | null;
}

function formatDateTime(value: string) {
  if (!value.trim()) {
    return "";
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

function buildNoticeCaption(title: string, message: string, scheduledAt: string) {
  const normalizedTitle = title.trim();
  const normalizedMessage = message.trim();
  const formattedScheduledAt = formatDateTime(scheduledAt);
  const captionLines = [];

  if (normalizedTitle) {
    captionLines.push(normalizedTitle);
  }

  if (normalizedMessage) {
    captionLines.push(normalizedMessage);
  }

  if (formattedScheduledAt) {
    captionLines.push(`Data agendada: ${formattedScheduledAt}`);
  }

  return captionLines.join("\n\n");
}

export function NoticePreviewCard({
  title,
  message,
  imageUrl,
  targetLabel,
  scheduledAt,
  status,
  churchName,
  imageMessage,
}: NoticePreviewCardProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [whatsappStatus, setWhatsappStatus] =
    useState<WhatsappIntegrationStatusItem | null>(null);
  const [whatsappStatusError, setWhatsappStatusError] = useState<string | null>(null);
  const captionText = useMemo(
    () => buildNoticeCaption(title, message, scheduledAt),
    [message, scheduledAt, title],
  );
  const resolvedImageUrl =
    normalizeTenantLogoUrl(imageUrl, { resolveRelative: true }) ?? "";
  const hasPreviewImage =
    Boolean(resolvedImageUrl) && resolvedImageUrl !== failedImageUrl;
  const hasResolvedImage = Boolean(resolvedImageUrl);

  useEffect(() => {
    let isActive = true;

    async function loadWhatsappStatus() {
      try {
        const response = await getWhatsappIntegrationStatus();

        if (!isActive) {
          return;
        }

        setWhatsappStatus(response);
        setWhatsappStatusError(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setWhatsappStatus(null);
        setWhatsappStatusError(
          getApiErrorMessage(
            error,
            "Nao foi possivel verificar a integracao oficial do WhatsApp. O fluxo manual segue disponivel.",
          ),
        );
      }
    }

    void loadWhatsappStatus();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleCopyCaption() {
    if (!captionText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(captionText);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  function handleOpenImage() {
    if (!resolvedImageUrl) {
      return;
    }

    window.open(resolvedImageUrl, "_blank", "noopener,noreferrer");
  }

  function handleOpenWhatsApp() {
    if (!captionText) {
      return;
    }

    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(captionText)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="bg-white/85">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle>Preview do aviso</CardTitle>
            <CardDescription>
              Visualizacao manual da mensagem com fallback preservado para o WhatsApp.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleCopyCaption()}
              disabled={!captionText}
            >
              <Copy className="size-4" />
              {copyStatus === "success"
                ? "Legenda copiada"
                : copyStatus === "error"
                  ? "Falha ao copiar"
                  : "Copiar legenda"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenImage}
              disabled={!hasResolvedImage}
            >
              <ExternalLink className="size-4" />
              Abrir imagem
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenWhatsApp}
              disabled={!captionText}
            >
              <MessageCircle className="size-4" />
              Abrir no WhatsApp
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {whatsappStatusError ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            {whatsappStatusError}
          </div>
        ) : whatsappStatus ? (
          <div
            className={
              whatsappStatus.available
                ? "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
                : "rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800"
            }
          >
            {whatsappStatus.summary}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
            Verificando a disponibilidade da integracao oficial do WhatsApp.
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-border bg-secondary/20">
          {hasPreviewImage ? (
            <img
              src={resolvedImageUrl}
              alt={title || "Preview do aviso"}
              className="h-52 w-full object-cover"
              onError={() => setFailedImageUrl(resolvedImageUrl)}
            />
          ) : (
            <div className="flex h-52 flex-col items-center justify-center gap-3 text-muted-foreground">
              <ImageOff className="size-8" />
              <p className="text-sm">
                {resolvedImageUrl
                  ? "Nao foi possivel carregar a imagem."
                  : "Sem imagem para este aviso."}
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
            {scheduledAt.trim() ? (
              <p className="text-sm text-muted-foreground">
                Agendamento: {formatDateTime(scheduledAt)}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-secondary/20 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {message.trim() || "A mensagem aparecera aqui conforme voce preencher o formulario."}
            </p>
          </div>

          {imageMessage ? (
            <p className="text-xs leading-5 text-muted-foreground">{imageMessage}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
