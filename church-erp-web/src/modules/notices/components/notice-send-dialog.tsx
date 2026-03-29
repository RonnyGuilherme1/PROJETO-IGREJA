"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CheckCircle2,
  ImageOff,
  LoaderCircle,
  Search,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/http";
import { normalizeTenantLogoUrl } from "@/lib/tenant-branding";
import { cn } from "@/lib/utils";
import {
  getWhatsappIntegrationStatus,
  listWhatsappDestinations,
} from "@/modules/notice-delivery/services/whatsapp-service";
import type {
  WhatsappDestinationItem,
  WhatsappIntegrationStatusItem,
} from "@/modules/notice-delivery/types/whatsapp";
import { buildNoticeCaption } from "@/modules/notices/components/notice-preview-card";
import { sendNotice } from "@/modules/notices/services/notices-service";
import type { NoticeDeliveryResult } from "@/modules/notices/types/notices";

interface NoticeSendDialogProps {
  open: boolean;
  noticeId?: string;
  resolveNoticeId?: () => Promise<string>;
  title: string;
  message: string;
  scheduledAt: string;
  imageUrl: string;
  onOpenChange: (open: boolean) => void;
  sendBlockedReason?: string | null;
}

function getDestinationTypeLabel(type: WhatsappDestinationItem["type"]) {
  return type === "GROUP" ? "Grupo" : "Contato";
}

function getDestinationIdentity(destination: WhatsappDestinationItem) {
  if (destination.type === "GROUP") {
    return destination.groupId?.trim() || "Grupo cadastrado";
  }

  return destination.phoneNumber?.trim() || "Numero cadastrado";
}

function sortDestinations(
  left: WhatsappDestinationItem,
  right: WhatsappDestinationItem,
) {
  if (left.type !== right.type) {
    return left.type === "GROUP" ? -1 : 1;
  }

  return left.label.localeCompare(right.label, "pt-BR", {
    sensitivity: "base",
  });
}

function isIntegrationReady(status: WhatsappIntegrationStatusItem | null) {
  return Boolean(
    status &&
      status.available &&
      status.enabled &&
      status.connectionStatus === "CONNECTED",
  );
}

const TECHNICAL_COPY_PATTERN =
  /master|onboarding|provider|fallback manual|conexao oficial|configurac(?:ao|oes)\s*>\s*whatsapp|configurac(?:ao|oes)\s+tecnica|token|credencial|callback|code exchange|phone number id|business account|webhook|fluxo centralizado|\/master|\/configuracoes/i;

function sanitizeUserFacingText(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value) {
    return fallback;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || TECHNICAL_COPY_PATTERN.test(trimmedValue)) {
    return fallback;
  }

  return trimmedValue;
}

function getFriendlyIntegrationMessage(
  status: WhatsappIntegrationStatusItem | null,
) {
  if (!status) {
    return "A integracao do WhatsApp nao esta disponivel no momento.";
  }

  if (status.available && status.connectionStatus === "CONNECTED") {
    return "WhatsApp disponivel para envio.";
  }

  if (status.connectionStatus === "PENDING_AUTHORIZATION") {
    return "A ativacao do WhatsApp ainda esta em andamento. O envio ficara disponivel assim que tudo estiver concluido.";
  }

  if (status.connectionStatus === "ERROR") {
    return "A integracao do WhatsApp nao esta disponivel no momento. Se precisar, fale com o suporte.";
  }

  if (!status.hasDestinations) {
    return "O envio ficara disponivel assim que houver ao menos um grupo ou contato ativo.";
  }

  return "O envio pelo WhatsApp ainda nao esta disponivel neste ambiente. Para ativar esta funcao, contate o suporte.";
}

function getDeliveryStatusLabel(status: NoticeDeliveryResult["status"]) {
  switch (status) {
    case "SENT":
      return "Enviado";
    case "FAILED":
      return "Falha";
    default:
      return "Em andamento";
  }
}

export function NoticeSendDialog({
  open,
  noticeId,
  resolveNoticeId,
  title,
  message,
  scheduledAt,
  imageUrl,
  onOpenChange,
  sendBlockedReason,
}: NoticeSendDialogProps) {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] =
    useState<WhatsappIntegrationStatusItem | null>(null);
  const [destinations, setDestinations] = useState<WhatsappDestinationItem[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState("");
  const [deliveryResult, setDeliveryResult] = useState<NoticeDeliveryResult | null>(
    null,
  );
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [resolvedNoticeId, setResolvedNoticeId] = useState<string | null>(null);

  const captionText = useMemo(
    () => buildNoticeCaption(title, message, scheduledAt),
    [message, scheduledAt, title],
  );
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const resolvedImageUrl =
    normalizeTenantLogoUrl(imageUrl, { resolveRelative: true }) ?? "";
  const hasPreviewImage =
    Boolean(resolvedImageUrl) && resolvedImageUrl !== failedImageUrl;
  const integrationReady = isIntegrationReady(integrationStatus);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      if (!normalizedSearch) {
        return true;
      }

      return destination.label.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
    });
  }, [destinations, normalizedSearch]);

  const selectedDestination = useMemo(
    () =>
      filteredDestinations.find(
        (destination) => destination.id === selectedDestinationId,
      ) ??
      destinations.find((destination) => destination.id === selectedDestinationId) ??
      null,
    [destinations, filteredDestinations, selectedDestinationId],
  );

  useEffect(() => {
    if (!open) {
      setSearch("");
      setLoadError(null);
      setSubmitError(null);
      setDeliveryResult(null);
      setFailedImageUrl(null);
      setResolvedNoticeId(null);
      return;
    }

    let isActive = true;

    async function loadDialogData() {
      setIsLoading(true);
      setLoadError(null);
      setSubmitError(null);
      setDeliveryResult(null);

      try {
        const [statusResponse, destinationsResponse] = await Promise.all([
          getWhatsappIntegrationStatus(),
          listWhatsappDestinations(),
        ]);

        if (!isActive) {
          return;
        }

        const nextDestinations = destinationsResponse
          .filter((destination) => destination.enabled)
          .sort(sortDestinations);

        setIntegrationStatus(statusResponse);
        setDestinations(nextDestinations);
        setSelectedDestinationId((current) => {
          if (current && nextDestinations.some((destination) => destination.id === current)) {
            return current;
          }

          return nextDestinations[0]?.id ?? "";
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setIntegrationStatus(null);
        setDestinations([]);
        setSelectedDestinationId("");
        setLoadError(
          sanitizeUserFacingText(
            getApiErrorMessage(
              error,
              "Nao foi possivel carregar as informacoes do WhatsApp para este envio.",
            ),
            "Nao foi possivel carregar as informacoes do WhatsApp para este envio.",
          ),
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadDialogData();

    return () => {
      isActive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!selectedDestinationId && filteredDestinations.length > 0) {
      setSelectedDestinationId(filteredDestinations[0].id);
      return;
    }

    if (
      selectedDestinationId &&
      filteredDestinations.length > 0 &&
      !filteredDestinations.some(
        (destination) => destination.id === selectedDestinationId,
      )
    ) {
      setSelectedDestinationId(filteredDestinations[0].id);
    }
  }, [filteredDestinations, selectedDestinationId]);

  async function handleConfirmSend() {
    if (!selectedDestinationId || !integrationReady || isSending) {
      return;
    }

    setIsSending(true);
    setSubmitError(null);
    setDeliveryResult(null);

    try {
      let targetNoticeId = resolvedNoticeId ?? noticeId ?? null;

      if (!targetNoticeId && resolveNoticeId) {
        targetNoticeId = await resolveNoticeId();
        setResolvedNoticeId(targetNoticeId);
      }

      if (!targetNoticeId) {
        setSubmitError("Nao foi possivel preparar o aviso para envio.");
        setIsSending(false);
        return;
      }

      const response = await sendNotice(targetNoticeId, {
        destinationId: selectedDestinationId,
        finalCaption: captionText,
      });

      setDeliveryResult(response);
    } catch (error) {
      setSubmitError(
        sanitizeUserFacingText(
          getApiErrorMessage(error, "Nao foi possivel enviar o aviso agora."),
          "Nao foi possivel enviar o aviso agora.",
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/45 transition-opacity",
            "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
          )}
        />

        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl",
            "max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border bg-card shadow-2xl",
            "duration-200 data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
            "data-[state=open]:scale-100 data-[state=open]:opacity-100",
          )}
        >
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-current opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="size-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>

          <div className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden">
            <div className="border-b border-border/70 px-6 py-5 pr-14">
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                Enviar aviso
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                Selecione um grupo ou contato ativo para enviar este aviso pelo WhatsApp.
              </DialogPrimitive.Description>
            </div>

            <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
              <div className="border-b border-border/70 p-6 lg:border-b-0 lg:border-r">
                {sendBlockedReason ? (
                  <div className="space-y-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <h3 className="text-base font-semibold text-amber-900">
                      Envio indisponivel neste aviso
                    </h3>
                    <p className="text-sm leading-6 text-amber-900/90">
                      {sanitizeUserFacingText(
                        sendBlockedReason,
                        "Este aviso ainda nao pode ser enviado.",
                      )}
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="flex h-full min-h-64 items-center justify-center gap-3 rounded-3xl border border-border bg-secondary/15 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    Carregando grupos, contatos e disponibilidade do WhatsApp.
                  </div>
                ) : loadError ? (
                  <div className="space-y-4 rounded-3xl border border-destructive/20 bg-destructive/5 p-5">
                    <h3 className="text-base font-semibold text-destructive">
                      Nao foi possivel preparar o envio
                    </h3>
                    <p className="text-sm leading-6 text-destructive">{loadError}</p>
                  </div>
                ) : !integrationReady ? (
                  <div className="space-y-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <h3 className="text-base font-semibold text-amber-900">
                      WhatsApp indisponivel no momento
                    </h3>
                    <p className="text-sm leading-6 text-amber-900/90">
                      {getFriendlyIntegrationMessage(integrationStatus)}
                    </p>
                  </div>
                ) : destinations.length === 0 ? (
                  <div className="space-y-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <h3 className="text-base font-semibold text-amber-900">
                      Nenhum destino ativo encontrado
                    </h3>
                    <p className="text-sm leading-6 text-amber-900/90">
                      Nenhum grupo ou contato esta disponivel para envio no momento. Se precisar, fale com o suporte.
                    </p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Grupo ou contato
                      </p>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Buscar por nome do grupo ou contato"
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Grupos aparecem primeiro. Use contato individual quando necessario.
                      </p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                      {filteredDestinations.length === 0 ? (
                        <div className="rounded-3xl border border-border bg-secondary/15 p-5 text-sm text-muted-foreground">
                          Nenhum destino ativo encontrado para a busca informada.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredDestinations.map((destination) => {
                            const isSelected =
                              destination.id === selectedDestinationId;

                            return (
                              <button
                                key={destination.id}
                                type="button"
                                onClick={() => setSelectedDestinationId(destination.id)}
                                className={cn(
                                  "w-full rounded-3xl border p-4 text-left transition",
                                  isSelected
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border bg-white hover:border-primary/35",
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-semibold text-foreground">
                                        {destination.label}
                                      </span>
                                      <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                        {getDestinationTypeLabel(destination.type)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {getDestinationIdentity(destination)}
                                    </p>
                                  </div>

                                  <span
                                    className={cn(
                                      "flex size-10 items-center justify-center rounded-2xl border",
                                      destination.type === "GROUP"
                                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                                        : "border-sky-500/25 bg-sky-500/10 text-sky-700",
                                    )}
                                  >
                                    {destination.type === "GROUP" ? (
                                      <Users className="size-4" />
                                    ) : (
                                      <UserRound className="size-4" />
                                    )}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-y-auto bg-secondary/10 p-6">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-border bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Preview final
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          O envio usara a legenda abaixo e a imagem atual deste aviso.
                        </p>
                      </div>
                      {selectedDestination ? (
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          {selectedDestination.label}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-secondary/20">
                      {hasPreviewImage ? (
                        <img
                          src={resolvedImageUrl}
                          alt={title || "Preview do aviso"}
                          className="h-56 w-full object-cover"
                          onError={() => setFailedImageUrl(resolvedImageUrl)}
                        />
                      ) : (
                        <div className="flex h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
                          <ImageOff className="size-8" />
                          <p className="text-sm">
                            {resolvedImageUrl
                              ? "Nao foi possivel carregar a imagem salva."
                              : "O aviso sera enviado apenas com texto."}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-3xl border border-border bg-secondary/20 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {captionText ||
                          "A legenda final aparecera aqui quando o aviso tiver titulo ou mensagem."}
                      </p>
                    </div>
                  </div>

                  {submitError ? (
                    <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                      {submitError}
                    </div>
                  ) : null}

                  {deliveryResult ? (
                    <div
                      className={cn(
                        "rounded-3xl border p-4 text-sm",
                        deliveryResult.success
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800"
                          : "border-destructive/20 bg-destructive/5 text-destructive",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                        <div className="space-y-1">
                          <p className="font-medium">
                            {sanitizeUserFacingText(
                              deliveryResult.message,
                              deliveryResult.success
                                ? "Aviso enviado com sucesso."
                                : "Nao foi possivel concluir o envio do aviso.",
                            )}
                          </p>
                          <p>
                            Grupo ou contato: {deliveryResult.destinationLabel} - Situacao:{" "}
                            {getDeliveryStatusLabel(deliveryResult.status)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-border/70 px-6 py-4">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSending}
                >
                  Fechar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleConfirmSend()}
                  disabled={
                    isSending ||
                    Boolean(sendBlockedReason) ||
                    !integrationReady ||
                    !selectedDestinationId ||
                    (!noticeId && !resolveNoticeId)
                  }
                >
                  {isSending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Confirmar envio
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
