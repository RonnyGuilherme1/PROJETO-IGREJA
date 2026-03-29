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

function getConnectionStatusLabel(status: WhatsappConnectionStatus) {
  switch (status) {
    case "CONNECTED":
      return "Conectado";
    case "PENDING_AUTHORIZATION":
      return "Pendente";
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
        getApiErrorMessage(
          error,
          "Nao foi possivel carregar as configuracoes de WhatsApp deste ambiente.",
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
  const needsMasterAdjustment = connectionStatus !== "CONNECTED";

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
        setSuccessMessage("Destino WhatsApp atualizado com sucesso.");
      } else {
        await createWhatsappDestination(payload);
        setSuccessMessage("Destino WhatsApp criado com sucesso.");
      }

      await loadWhatsappData(true);
      setEditingDestination(null);
      setFormMode(null);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Nao foi possivel salvar o destino WhatsApp.",
      );
      setActionError(message);
      throw new Error(message);
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
      setSuccessMessage(`Destino "${destination.label}" inativado com sucesso.`);
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          "Nao foi possivel inativar o destino WhatsApp.",
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
        description="Acompanhe a conexao do ambiente e gerencie destinos com foco principal em grupos. Pessoa especifica continua disponivel quando necessario."
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
          <CardTitle>Status da integracao</CardTitle>
          <CardDescription>
            O onboarding e a conexao oficial ficam no master. Aqui o ambiente acompanha o estado atual sem expor token ou outras credenciais sensiveis.
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
                    {status?.summary ??
                      "A integracao do ambiente ainda nao informou um estado de conexao."}
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
                    Numero solicitado
                  </p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {config?.requestedPhoneNumber ?? "-"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Provider: {config?.provider ?? "WHATSAPP_CLOUD_API"}
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Fallback manual
                  </p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {config?.fallbackToManual ?? true ? "Ativo" : "Desligado"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Destinos ativos: {status?.destinationsCount ?? 0}
                  </p>
                </div>
              </div>

              {config?.lastErrorMessage ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {config.lastErrorMessage}
                </div>
              ) : null}

              {needsMasterAdjustment ? (
                <div className="flex flex-col gap-3 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-800">
                      <CircleAlert className="size-4" />
                      <p className="font-semibold">Conexao ainda nao pronta</p>
                    </div>
                    <p className="text-sm leading-6 text-amber-900/80">
                      O ambiente pode organizar destinos agora, mas a conexao oficial precisa ser ajustada no master antes do envio automatico.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/master/tenants">Ajustar no master</Link>
                  </Button>
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
              <CardTitle>Destinos WhatsApp</CardTitle>
              <CardDescription>
                O foco principal e grupo. Pessoa especifica continua disponivel para excecoes sem remover a prioridade dos grupos.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={handleCreateClick}>
              <Plus className="size-4" />
              Novo grupo ou destino
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
                    Aparecem primeiro na listagem e devem concentrar os avisos principais.
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      Pessoas
                    </p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {peopleCount}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Mantidas para excecoes, confirmacoes ou contatos diretos.
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Total de destinos
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {sortedDestinations.length}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Inativos permanecem listados para manter o historico operacional.
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
                      {formMode === "edit"
                        ? "Editar destino WhatsApp"
                        : "Novo destino WhatsApp"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Priorize grupos. Use pessoa especifica apenas quando o fluxo exigir um contato individual.
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
