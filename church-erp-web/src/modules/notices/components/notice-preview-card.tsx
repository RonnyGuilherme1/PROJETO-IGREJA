"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { ImageOff, Send } from "lucide-react";
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
import { getWhatsappIntegrationStatus } from "@/modules/notice-delivery/services/whatsapp-service";
import type { WhatsappIntegrationStatusItem } from "@/modules/notice-delivery/types/whatsapp";
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
  onSendClick?: () => void;
  sendDisabled?: boolean;
  sendHelperText?: string | null;
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

export function buildNoticeCaption(
  title: string,
  message: string,
  scheduledAt: string,
) {
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
  onSendClick,
  sendDisabled = false,
  sendHelperText,
}: NoticePreviewCardProps) {
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
            "Nao foi possivel verificar a integracao do WhatsApp neste momento.",
          ),
        );
      }
    }

    void loadWhatsappStatus();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <Card className="bg-white/85">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle>Preview do aviso</CardTitle>
            <CardDescription>
              Visualizacao do aviso com envio centralizado pelo sistema.
            </CardDescription>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button
              type="button"
              size="sm"
              onClick={onSendClick}
              disabled={!captionText || sendDisabled}
            >
              <Send className="size-4" />
              Enviar aviso
            </Button>
            {sendHelperText ? (
              <p className="max-w-xs text-xs leading-5 text-muted-foreground sm:text-right">
                {sendHelperText}
              </p>
            ) : null}
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
            Verificando a disponibilidade da integracao do WhatsApp.
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
              {message.trim() ||
                "A mensagem aparecera aqui conforme voce preencher o formulario."}
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
