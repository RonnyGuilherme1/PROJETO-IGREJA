"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CircleAlert,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listChurches } from "@/modules/churches/services/churches-service";
import type { ChurchItem } from "@/modules/churches/types/church";
import {
  createWhatsappDestination,
  getWhatsappIntegrationConfig,
  getWhatsappIntegrationStatus,
  inactivateWhatsappDestination,
  listWhatsappDestinations,
  updateWhatsappDestination,
} from "@/modules/notice-delivery/services/whatsapp-service";
import type {
  CreateWhatsappDestinationPayload,
  WhatsappConnectionStatus,
  WhatsappDestinationItem,
  WhatsappIntegrationConfigItem,
  WhatsappIntegrationStatusItem,
} from "@/modules/notice-delivery/types/whatsapp";
import { WhatsappDestinationForm } from "./whatsapp-destination-form";
import { WhatsappDestinationsTable } from "./whatsapp-destinations-table";

type DestinationFormMode = "create" | "edit" | null;

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(parsedDate);
}

const TECHNICAL_COPY_PATTERN =
  /master|onboarding|provider|fallback manual|conexao oficial|configurac(?:ao|oes)\s*>\s*whatsapp|configurac(?:ao|oes)\s+tecnica|token|credencial|callback|code exchange|phone number id|business account|webhook|fluxo centralizado|\/master|\/configuracoes/i;

function getConnectionStatusLabel(status: WhatsappConnectionStatus) {
  switch (status) {
    case "CONNECTED":
      return "Conectado";
    case "PENDING_AUTHORIZATION":
      return "Em ativacao";
    case "ERROR":
      return "Erro";
    default:
      return "Nao configurado";
  }
}

function getConnectionStatusTone(status: WhatsappConnectionStatus) {
  switch (status) {
    case "CONNECTED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "PENDING_AUTHORIZATION":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "ERROR":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-secondary/50 text-muted-foreground";
  }
}

function countDestinationType(
  destinations: WhatsappDestinationItem[],
  type: WhatsappDestinationItem["type"],
) {
  return destinations.filter((destination) => destination.type === type).length;
}

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

function getFriendlyConnectionMessage(status: WhatsappConnectionStatus) {
  switch (status) {
    case "CONNECTED":
      return "O WhatsApp deste ambiente esta disponivel para envio.";
    case "PENDING_AUTHORIZATION":
      return "A ativacao do WhatsApp ainda esta em andamento. O envio ficara disponivel assim que a liberacao for concluida.";
    case "ERROR":
      return "A integracao do WhatsApp nao esta disponivel no momento.";
    default:
      return "O WhatsApp ainda nao esta disponivel neste ambiente.";
  }
}

export function WhatsappSettingsPage() {
  const [config, setConfig] = useState<WhatsappIntegrationConfigItem | null>(null);
  const [status, setStatus] = useState<WhatsappIntegrationStatusItem | null>(null);
  const [destinations, setDestinations] = useState<WhatsappDestinationItem[]>([]);
  const [churches, setChurches] = useState<ChurchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingDestination, setIsSubmittingDestination] = useState(false);
  const [mutatingDestinationId, setMutatingDestinationId] = useState<string | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<DestinationFormMode>(null);
  const [editingDestination, setEditingDestination] =
    useState<WhatsappDestinationItem | null>(null);

  const loadWhatsappData = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    setLoadError(null);

    try {
      const [currentConfig, currentStatus, currentDestinations, churchesResult] =
        await Promise.all([
          getWhatsappIntegrationConfig(),
          getWhatsappIntegrationStatus(),
          listWhatsappDestinations(),
          listChurches({ name: "", status: "" }),
        ]);

      setConfig(currentConfig);
      setStatus(currentStatus);
      setDestinations(currentDestinations);
      setChurches(churchesResult.items);
    } catch (error) {
      setLoadError(
        sanitizeUserFacingText(
          getApiErrorMessage(
            error,
            "Nao foi possivel carregar as informacoes do WhatsApp deste ambiente.",
          ),
          "Nao foi possivel carregar as informacoes do WhatsApp deste ambiente.",
        ),
      );
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadWhatsappData();
  }, [loadWhatsappData]);

  const sortedDestinations = useMemo(
    () =>
      [...destinations].sort((left, right) => {
        if (left.type !== right.type) {
          return left.type === "GROUP" ? -1 : 1;
        }

        if (left.enabled !== right.enabled) {
          return left.enabled ? -1 : 1;
        }

        return left.label.localeCompare(right.label, "pt-BR", {
          sensitivity: "base",
        });
      }),
    [destinations],
  );

  const groupsCount = useMemo(
    () => countDestinationType(sortedDestinations, "GROUP"),
    [sortedDestinations],
  );
  const peopleCount = useMemo(
    () => countDestinationType(sortedDestinations, "PERSON"),
    [sortedDestinations],
  );
  const connectionStatus = config?.connectionStatus ?? "NOT_CONFIGURED";
  const needsSupportAttention = connectionStatus !== "CONNECTED";

  function handleCreateClick() {
    setActionError(null);
    setSuccessMessage(null);
    setEditingDestination(null);
    setFormMode("create");
  }

  function handleEditClick(destination: WhatsappDestinationItem) {
    setActionError(null);
    setSuccessMessage(null);
    setEditingDestination(destination);
    setFormMode("edit");
  }

  function handleCancelForm() {
    setEditingDestination(null);
    setFormMode(null);
    setActionError(null);
  }

  async function handleRefresh() {
    setActionError(null);
    setSuccessMessage(null);
    setIsRefreshing(true);

    try {
      await loadWhatsappData(true);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSubmitDestination(
    payload: CreateWhatsappDestinationPayload,
  ) {
    setActionError(null);
    setSuccessMessage(null);
    setIsSubmittingDestination(true);

    try {
      if (formMode === "edit" && editingDestination) {
        await updateWhatsappDestination(editingDestination.id, payload);
        setSuccessMessage("Grupo ou contato atualizado com sucesso.");
      } else {
        await createWhatsappDestination(payload);
        setSuccessMessage("Grupo ou contato adicionado com sucesso.");
      }

      await loadWhatsappData(true);
      setEditingDestination(null);
      setFormMode(null);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Nao foi possivel salvar o grupo ou contato.",
      );
      const userFacingMessage = sanitizeUserFacingText(
        message,
        "Nao foi possivel salvar o grupo ou contato.",
      );
      setActionError(
        userFacingMessage,
      );
      throw new Error(userFacingMessage);
    } finally {
      setIsSubmittingDestination(false);
    }
  }

  async function handleInactivate(destination: WhatsappDestinationItem) {
    setActionError(null);
    setSuccessMessage(null);
    setMutatingDestinationId(destination.id);

    try {
      await inactivateWhatsappDestination(destination.id);
      await loadWhatsappData(true);
      setSuccessMessage(`"${destination.label}" foi desativado com sucesso.`);
    } catch (error) {
      setActionError(
        sanitizeUserFacingText(
          getApiErrorMessage(
            error,
            "Nao foi possivel desativar este item.",
          ),
          "Nao foi possivel desativar este item.",
        ),
      );
    } finally {
      setMutatingDestinationId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Acompanhe a disponibilidade do WhatsApp e organize os grupos e contatos que podem receber avisos."
        badge="Configuracoes"
        action={
          <Button asChild variant="outline">
            <Link href="/configuracoes">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>Status do WhatsApp</CardTitle>
          <CardDescription>
            Consulte a disponibilidade do envio, o numero vinculado e as ultimas atualizacoes deste ambiente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Conexao
                  </p>
                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getConnectionStatusTone(
                      connectionStatus,
                    )}`}
                  >
                    {getConnectionStatusLabel(connectionStatus)}
                  </span>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {getFriendlyConnectionMessage(connectionStatus)}
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Numero conectado
                  </p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {config?.connectedPhoneDisplay ?? "-"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ultima conexao: {formatDateTime(config?.lastConnectedAt ?? null)}
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Numero informado
                  </p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {config?.requestedPhoneNumber ?? "-"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ultima atualizacao: {formatDateTime(config?.updatedAt ?? null)}
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Destinos ativos
                  </p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {status?.destinationsCount ?? 0}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Total cadastrados: {sortedDestinations.length}
                  </p>
                </div>
              </div>

              {config?.lastErrorMessage ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {sanitizeUserFacingText(
                    config.lastErrorMessage,
                    "Houve um problema com o WhatsApp deste ambiente. Se precisar, fale com o suporte.",
                  )}
                </div>
              ) : null}

              {needsSupportAttention ? (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-800">
                      <CircleAlert className="size-4" />
                      <p className="font-semibold">WhatsApp indisponivel no momento</p>
                    </div>
                    <p className="text-sm leading-6 text-amber-900/80">
                      {getFriendlyConnectionMessage(connectionStatus)} Se precisar, fale com o suporte ou com o desenvolvedor responsavel.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Atualizar status
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/90">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle>Grupos e contatos</CardTitle>
              <CardDescription>
                Organize os grupos e contatos que podem receber avisos por este ambiente.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={handleCreateClick}>
              <Plus className="size-4" />
              Novo grupo ou contato
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {actionError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {actionError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="size-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      Grupos
                    </p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {groupsCount}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Recomendados para comunicados enviados a varias pessoas.
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      Contatos
                    </p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {peopleCount}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use quando precisar enviar para um contato individual.
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Total cadastrado
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {sortedDestinations.length}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Os itens inativos continuam listados para facilitar a organizacao.
                  </p>
                </div>
              </div>

              <WhatsappDestinationsTable
                churches={churches}
                destinations={sortedDestinations}
                isMutating={Boolean(mutatingDestinationId)}
                mutatingDestinationId={mutatingDestinationId}
                onEdit={handleEditClick}
                onInactivate={(destination) => void handleInactivate(destination)}
              />

              {formMode ? (
                <div className="rounded-3xl border border-border bg-secondary/15 p-5">
                  <div className="mb-4 space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {formMode === "edit" ? "Editar grupo ou contato" : "Novo grupo ou contato"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Cadastre grupos e contatos que podem receber avisos neste ambiente.
                    </p>
                  </div>

                  <WhatsappDestinationForm
                    key={editingDestination?.id ?? formMode}
                    churches={churches}
                    destination={editingDestination}
                    isSubmitting={isSubmittingDestination}
                    onCancel={handleCancelForm}
                    onSubmit={handleSubmitDestination}
                  />
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
