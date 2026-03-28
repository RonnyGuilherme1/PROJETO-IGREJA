"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import { ErrorView } from "@/components/shared/error-view";
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
  createCampaign,
  getCampaignById,
  updateCampaign,
} from "@/modules/campaigns/services/campaigns-service";
import {
  CAMPAIGN_STATUS_OPTIONS,
  type CampaignDetailItem,
  type CampaignFormValues,
  type CreateCampaignPayload,
  type UpdateCampaignPayload,
} from "@/modules/campaigns/types/campaign";
import { listChurches } from "@/modules/churches/services/churches-service";

interface CampaignFormPageProps {
  mode: "create" | "edit";
  campaignId?: string;
}

interface ChurchOption {
  id: string;
  name: string;
}

const initialFormValues: CampaignFormValues = {
  churchId: "",
  title: "",
  description: "",
  installmentCount: "12",
  installmentAmount: "",
  startDate: "",
  status: "ACTIVE",
};

const textareaClassName =
  "flex min-h-28 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function formatDateInput(value: string | null) {
  if (!value) {
    return "";
  }

  return value.includes("T") ? value.slice(0, 10) : value;
}

export function CampaignFormPage({
  mode,
  campaignId,
}: CampaignFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<CampaignFormValues>(initialFormValues);
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>([]);
  const [campaign, setCampaign] = useState<CampaignDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [churchesResponse, campaignResponse] = await Promise.all([
          listChurches({ name: "", status: "" }),
          mode === "edit" && campaignId ? getCampaignById(campaignId) : Promise.resolve(null),
        ]);

        if (!isActive) {
          return;
        }

        const nextChurchOptions = churchesResponse.items.map((church) => ({
          id: church.id,
          name: church.name,
        }));
        const singleChurchId =
          nextChurchOptions.length === 1 ? nextChurchOptions[0].id : "";

        setChurchOptions(nextChurchOptions);

        if (campaignResponse) {
          setCampaign(campaignResponse);
          setFormValues({
            churchId: campaignResponse.churchId,
            title: campaignResponse.title,
            description: campaignResponse.description ?? "",
            installmentCount: String(campaignResponse.installmentCount),
            installmentAmount: campaignResponse.installmentAmount,
            startDate: formatDateInput(campaignResponse.startDate),
            status: campaignResponse.status,
          });
        } else {
          setFormValues((current) => ({
            ...current,
            churchId: singleChurchId,
          }));
        }
      } catch (error) {
        if (isActive) {
          setLoadError(
            getApiErrorMessage(
              error,
              mode === "create"
                ? "Nao foi possivel carregar os dados iniciais da campanha."
                : "Nao foi possivel carregar os dados da campanha para edicao.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isActive = false;
    };
  }, [mode, campaignId]);

  const isStructureLocked = useMemo(
    () => mode === "edit" && (campaign?.membersCount ?? 0) > 0,
    [campaign?.membersCount, mode],
  );

  function handleFieldChange(field: keyof CampaignFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      let savedCampaignId = campaignId ?? "";

      if (mode === "create") {
        const payload: CreateCampaignPayload = {
          churchId: formValues.churchId,
          title: formValues.title,
          description: formValues.description,
          installmentCount: Number(formValues.installmentCount),
          installmentAmount: formValues.installmentAmount,
          startDate: formValues.startDate || null,
          status: formValues.status,
        };

        const createdCampaign = await createCampaign(payload);
        savedCampaignId = createdCampaign.id;
      } else if (campaignId) {
        const payload: UpdateCampaignPayload = {
          churchId: formValues.churchId,
          title: formValues.title,
          description: formValues.description,
          installmentCount: Number(formValues.installmentCount),
          installmentAmount: formValues.installmentAmount,
          startDate: formValues.startDate || null,
          status: formValues.status,
        };

        const updatedCampaign = await updateCampaign(campaignId, payload);
        savedCampaignId = updatedCampaign.id;
      }

      startTransition(() => {
        router.replace(`/campanhas/${savedCampaignId}`);
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Nao foi possivel criar a campanha."
            : "Nao foi possivel salvar as alteracoes da campanha.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <ErrorView
        title="Nao foi possivel abrir esta campanha"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Nova campanha" : "Editar campanha"}
        description={
          mode === "create"
            ? "Cadastre uma campanha parcelada definindo igreja, quantidade de parcelas e valor de contribuicao."
            : "Atualize os dados da campanha. O vinculo de membros e o controle de parcelas ficam na tela de detalhe."
        }
        badge="Campanhas"
        action={
          <Button asChild variant="outline">
            <Link href={campaignId ? `/campanhas/${campaignId}` : "/campanhas"}>
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Cadastro de campanha" : "Edicao de campanha"}
          </CardTitle>
          <CardDescription>
            Defina a estrutura da campanha. Apos salvar, use o detalhe para vincular membros e acompanhar parcelas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isStructureLocked ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
              Esta campanha ja possui membros vinculados. Igreja, quantidade de parcelas,
              valor da parcela e data inicial foram bloqueados para refletir a regra da API.
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="campaign-title">Titulo</Label>
                  <Input
                    id="campaign-title"
                    value={formValues.title}
                    onChange={(event) =>
                      handleFieldChange("title", event.target.value)
                    }
                    placeholder="Nome da campanha"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-church">Igreja</Label>
                  <Select
                    id="campaign-church"
                    value={formValues.churchId}
                    onChange={(event) =>
                      handleFieldChange("churchId", event.target.value)
                    }
                    required
                    disabled={isStructureLocked}
                  >
                    <option value="">Selecione uma igreja</option>
                    {churchOptions.map((church) => (
                      <option key={church.id} value={church.id}>
                        {church.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-status">Status</Label>
                  <Select
                    id="campaign-status"
                    value={formValues.status}
                    onChange={(event) =>
                      handleFieldChange("status", event.target.value)
                    }
                  >
                    {CAMPAIGN_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-installment-count">
                    Quantidade de parcelas
                  </Label>
                  <Input
                    id="campaign-installment-count"
                    type="number"
                    min="1"
                    value={formValues.installmentCount}
                    onChange={(event) =>
                      handleFieldChange("installmentCount", event.target.value)
                    }
                    required
                    disabled={isStructureLocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-installment-amount">
                    Valor da parcela
                  </Label>
                  <Input
                    id="campaign-installment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formValues.installmentAmount}
                    onChange={(event) =>
                      handleFieldChange("installmentAmount", event.target.value)
                    }
                    placeholder="0,00"
                    required
                    disabled={isStructureLocked}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="campaign-start-date">Data inicial</Label>
                  <Input
                    id="campaign-start-date"
                    type="date"
                    value={formValues.startDate}
                    onChange={(event) =>
                      handleFieldChange("startDate", event.target.value)
                    }
                    disabled={isStructureLocked}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-description">Descricao</Label>
                <textarea
                  id="campaign-description"
                  className={textareaClassName}
                  value={formValues.description}
                  onChange={(event) =>
                    handleFieldChange("description", event.target.value)
                  }
                  placeholder="Contextualize objetivo, publico e observacoes da campanha"
                />
              </div>

              {submitError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting || isRedirecting}>
                  {isSubmitting || isRedirecting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {mode === "create" ? "Criar campanha" : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline">
                  <Link href={campaignId ? `/campanhas/${campaignId}` : "/campanhas"}>
                    Cancelar
                  </Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
