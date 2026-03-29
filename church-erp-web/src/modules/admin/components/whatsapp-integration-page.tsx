"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getWhatsappIntegrationConfig,
  getWhatsappIntegrationStatus,
  updateWhatsappIntegrationConfig,
} from "@/modules/notice-delivery/services/whatsapp-delivery-service";
import type {
  UpdateWhatsappIntegrationDestinationPayload,
  WhatsappIntegrationConfigItem,
  WhatsappIntegrationStatusItem,
} from "@/modules/notice-delivery/types/whatsapp-delivery";

interface WhatsappDestinationFormValue {
  id: string;
  label: string;
  phoneNumber: string;
  enabled: boolean;
}

interface WhatsappIntegrationFormValues {
  enabled: boolean;
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  clearAccessToken: boolean;
  destinations: WhatsappDestinationFormValue[];
}

function createEmptyDestination(): WhatsappDestinationFormValue {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `destination-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: "",
    phoneNumber: "",
    enabled: true,
  };
}

function buildFormValues(
  config?: WhatsappIntegrationConfigItem | null,
): WhatsappIntegrationFormValues {
  return {
    enabled: config?.enabled ?? false,
    businessAccountId: config?.businessAccountId ?? "",
    phoneNumberId: config?.phoneNumberId ?? "",
    accessToken: "",
    clearAccessToken: false,
    destinations:
      config?.destinations.map((destination) => ({
        id: destination.id,
        label: destination.label,
        phoneNumber: destination.phoneNumber,
        enabled: destination.enabled,
      })) ?? [],
  };
}

export function WhatsappIntegrationPage() {
  const [config, setConfig] = useState<WhatsappIntegrationConfigItem | null>(null);
  const [status, setStatus] = useState<WhatsappIntegrationStatusItem | null>(null);
  const [formValues, setFormValues] = useState<WhatsappIntegrationFormValues>(
    buildFormValues(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [currentConfig, currentStatus] = await Promise.all([
        getWhatsappIntegrationConfig(),
        getWhatsappIntegrationStatus(),
      ]);

      setConfig(currentConfig);
      setStatus(currentStatus);
      setFormValues(buildFormValues(currentConfig));
    } catch (error) {
      setLoadError(
        getApiErrorMessage(
          error,
          "Nao foi possivel carregar a configuracao oficial do WhatsApp.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const enabledDestinationsCount = useMemo(
    () => formValues.destinations.filter((destination) => destination.enabled).length,
    [formValues.destinations],
  );
  const hasStoredAccessToken = config?.hasAccessToken ?? false;

  function handleFieldChange(
    field: Exclude<
      keyof WhatsappIntegrationFormValues,
      "destinations" | "enabled" | "clearAccessToken"
    >,
    value: string,
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleBooleanFieldChange(
    field: "enabled" | "clearAccessToken",
    value: boolean,
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
      ...(field === "clearAccessToken" && value ? { accessToken: "" } : {}),
    }));
  }

  function handleDestinationChange(
    destinationId: string,
    field: keyof UpdateWhatsappIntegrationDestinationPayload,
    value: string | boolean,
  ) {
    setFormValues((current) => ({
      ...current,
      destinations: current.destinations.map((destination) =>
        destination.id === destinationId
          ? {
              ...destination,
              [field]: value,
            }
          : destination,
      ),
    }));
  }

  function handleAddDestination() {
    setFormValues((current) => ({
      ...current,
      destinations: [...current.destinations, createEmptyDestination()],
    }));
  }

  function handleRemoveDestination(destinationId: string) {
    setFormValues((current) => ({
      ...current,
      destinations: current.destinations.filter(
        (destination) => destination.id !== destinationId,
      ),
    }));
  }

  function handleResetForm() {
    setFormValues(buildFormValues(config));
    setSubmitError(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const savedConfig = await updateWhatsappIntegrationConfig({
        enabled: formValues.enabled,
        businessAccountId: formValues.businessAccountId,
        phoneNumberId: formValues.phoneNumberId,
        accessToken: formValues.clearAccessToken ? null : formValues.accessToken,
        clearAccessToken: formValues.clearAccessToken,
        fallbackToManual: true,
        destinations: formValues.destinations,
      });
      const refreshedStatus = await getWhatsappIntegrationStatus();

      setConfig(savedConfig);
      setStatus(refreshedStatus);
      setFormValues(buildFormValues(savedConfig));
      setSuccessMessage(
        "Configuracao oficial do WhatsApp salva com sucesso. O fluxo manual permanece como fallback.",
      );
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          "Nao foi possivel salvar a configuracao oficial do WhatsApp.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp oficial"
        description="Prepare credenciais e destinos para uma integracao oficial futura, sem acoplar envio automatico ao CRUD de avisos."
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
          <CardTitle>Status da preparacao</CardTitle>
          <CardDescription>
            Esta etapa cria somente a base tecnica isolada. O envio manual dos avisos continua funcionando independentemente desta configuracao.
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
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Modo atual
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {status?.available
                    ? "Pronto para evoluir"
                    : status?.enabled
                      ? "Preparacao em andamento"
                      : "Fallback manual ativo"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {status?.summary ||
                    "A integracao oficial ainda nao foi validada. O fluxo manual permanece disponivel."}
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Credenciais
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {status?.hasAccessToken ? "Token salvo" : "Token pendente"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Phone number ID: {config?.phoneNumberId?.trim() || "Nao informado"}
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-secondary/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Destinos ativos
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {status?.destinationsCount ?? 0}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Cadastre os numeros que poderao ser usados por uma rotina futura desacoplada.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>Configuracao oficial</CardTitle>
          <CardDescription>
            Defina credenciais e destinos sem remover o fluxo manual de copiar legenda, abrir imagem e abrir no WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-integration-enabled">Status</Label>
                  <Select
                    id="whatsapp-integration-enabled"
                    value={formValues.enabled ? "enabled" : "disabled"}
                    onChange={(event) =>
                      handleBooleanFieldChange(
                        "enabled",
                        event.target.value === "enabled",
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="disabled">Inativa</option>
                    <option value="enabled">Ativa</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp-business-account-id">
                    Business account ID
                  </Label>
                  <Input
                    id="whatsapp-business-account-id"
                    value={formValues.businessAccountId}
                    onChange={(event) =>
                      handleFieldChange("businessAccountId", event.target.value)
                    }
                    placeholder="ID da conta comercial oficial"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp-phone-number-id">Phone number ID</Label>
                  <Input
                    id="whatsapp-phone-number-id"
                    value={formValues.phoneNumberId}
                    onChange={(event) =>
                      handleFieldChange("phoneNumberId", event.target.value)
                    }
                    placeholder="ID do numero no provedor oficial"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp-access-token">Access token</Label>
                  <Input
                    id="whatsapp-access-token"
                    type="password"
                    value={formValues.accessToken}
                    onChange={(event) => {
                      handleBooleanFieldChange("clearAccessToken", false);
                      handleFieldChange("accessToken", event.target.value);
                    }}
                    placeholder={
                      hasStoredAccessToken
                        ? config?.accessTokenMask || "Token salvo"
                        : "Cole o token oficial do provedor"
                    }
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-muted-foreground">
                      O token salvo nao e exibido novamente. Informe um novo valor apenas se quiser substituir o atual.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleBooleanFieldChange("clearAccessToken", true)}
                      disabled={isSubmitting || !hasStoredAccessToken}
                    >
                      Remover token salvo
                    </Button>
                  </div>
                  {formValues.clearAccessToken ? (
                    <p className="text-xs leading-5 text-amber-700">
                      O token atual sera removido ao salvar.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-border bg-secondary/15 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      Destinos cadastrados
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Use numeros em formato internacional. Os destinos ficam separados do cadastro de avisos para um envio futuro desacoplado.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddDestination}
                    disabled={isSubmitting}
                  >
                    <Plus className="size-4" />
                    Adicionar destino
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Total
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {formValues.destinations.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Ativos
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {enabledDestinationsCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Fallback
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      Manual preservado
                    </p>
                  </div>
                </div>

                {formValues.destinations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-6 text-sm text-muted-foreground">
                    Nenhum destino cadastrado ainda. Se a integracao oficial nao estiver completa, o sistema continua usando somente o fluxo manual.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formValues.destinations.map((destination, index) => (
                      <div
                        key={destination.id}
                        className="rounded-2xl border border-border bg-white p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.9fr)_160px]">
                            <div className="space-y-2">
                              <Label htmlFor={`destination-label-${destination.id}`}>
                                Nome do destino
                              </Label>
                              <Input
                                id={`destination-label-${destination.id}`}
                                value={destination.label}
                                onChange={(event) =>
                                  handleDestinationChange(
                                    destination.id,
                                    "label",
                                    event.target.value,
                                  )
                                }
                                placeholder={`Destino ${index + 1}`}
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`destination-phone-${destination.id}`}>
                                Numero
                              </Label>
                              <Input
                                id={`destination-phone-${destination.id}`}
                                value={destination.phoneNumber}
                                onChange={(event) =>
                                  handleDestinationChange(
                                    destination.id,
                                    "phoneNumber",
                                    event.target.value,
                                  )
                                }
                                placeholder="+5585987654321"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`destination-enabled-${destination.id}`}>
                                Status
                              </Label>
                              <Select
                                id={`destination-enabled-${destination.id}`}
                                value={destination.enabled ? "enabled" : "disabled"}
                                onChange={(event) =>
                                  handleDestinationChange(
                                    destination.id,
                                    "enabled",
                                    event.target.value === "enabled",
                                  )
                                }
                                disabled={isSubmitting}
                              >
                                <option value="enabled">Ativo</option>
                                <option value="disabled">Inativo</option>
                              </Select>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleRemoveDestination(destination.id)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="size-4" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Salvar configuracao
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetForm}
                  disabled={isSubmitting}
                >
                  Descartar alteracoes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
