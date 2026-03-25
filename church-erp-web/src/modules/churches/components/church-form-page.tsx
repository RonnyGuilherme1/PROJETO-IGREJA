"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import { ErrorView } from "@/components/shared/error-view";
import { PageLoading } from "@/components/shared/page-loading";
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
  createChurch,
  getChurchById,
  updateChurch,
} from "@/modules/churches/services/churches-service";
import {
  CHURCH_STATUS_OPTIONS,
  type ChurchFormValues,
  type CreateChurchPayload,
  type UpdateChurchPayload,
} from "@/modules/churches/types/church";

interface ChurchFormPageProps {
  mode: "create" | "edit";
  churchId?: string;
}

const initialFormValues: ChurchFormValues = {
  name: "",
  cnpj: "",
  phone: "",
  email: "",
  address: "",
  pastorName: "",
  status: "ACTIVE",
  notes: "",
};

const textareaClassName =
  "flex min-h-28 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const LIST_PATH = "/igrejas";

export function ChurchFormPage({ mode, churchId }: ChurchFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<ChurchFormValues>(initialFormValues);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "edit" || !churchId) {
      return;
    }

    const currentChurchId = churchId;
    let isActive = true;

    async function loadChurch() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const church = await getChurchById(currentChurchId);

        if (!isActive) {
          return;
        }

        setFormValues({
          name: church.name,
          cnpj: church.cnpj ?? "",
          phone: church.phone ?? "",
          email: church.email ?? "",
          address: church.address ?? "",
          pastorName: church.pastorName ?? "",
          status: church.status || "ACTIVE",
          notes: church.notes ?? "",
        });
      } catch (error) {
        if (isActive) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Nao foi possivel carregar os dados da igreja.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadChurch();

    return () => {
      isActive = false;
    };
  }, [mode, churchId]);

  function handleFieldChange(field: keyof ChurchFormValues, value: string) {
    if (submitError) {
      setSubmitError(null);
    }

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
      if (mode === "create") {
        const payload: CreateChurchPayload = {
          name: formValues.name,
          cnpj: formValues.cnpj,
          phone: formValues.phone,
          email: formValues.email,
          address: formValues.address,
          pastorName: formValues.pastorName,
          status: formValues.status,
          notes: formValues.notes,
        };

        await createChurch(payload);
      } else if (churchId) {
        const payload: UpdateChurchPayload = {
          name: formValues.name,
          cnpj: formValues.cnpj,
          phone: formValues.phone,
          email: formValues.email,
          address: formValues.address,
          pastorName: formValues.pastorName,
          status: formValues.status,
          notes: formValues.notes,
        };

        await updateChurch(churchId, payload);
      }

      startTransition(() => {
        router.replace(
          `${LIST_PATH}?feedback=${mode === "create" ? "created" : "updated"}`,
        );
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          "Nao foi possivel salvar os dados. Revise as informacoes e tente novamente.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isBusy = isSubmitting || isRedirecting;

  if (loadError) {
    return (
      <ErrorView
        title="Nao foi possivel carregar o formulario"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Nova igreja" : "Editar igreja"}
        description={
          mode === "create"
            ? "Cadastre uma nova igreja com os dados principais para uso no painel administrativo."
            : "Atualize os dados da igreja com o mesmo fluxo usado nos demais cadastros."
        }
        badge="Igrejas"
        action={
          <Button asChild variant="outline">
            <Link href={LIST_PATH}>
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Cadastro de igreja" : "Edicao de igreja"}
          </CardTitle>
          <CardDescription>
            Preencha os dados principais da igreja para manter o cadastro
            administrativo organizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading variant="form" fields={6} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="church-name">Nome</Label>
                  <Input
                    id="church-name"
                    value={formValues.name}
                    onChange={(event) =>
                      handleFieldChange("name", event.target.value)
                    }
                    placeholder="Nome da igreja"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="church-cnpj">CNPJ</Label>
                  <Input
                    id="church-cnpj"
                    value={formValues.cnpj}
                    onChange={(event) =>
                      handleFieldChange("cnpj", event.target.value)
                    }
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="church-phone">Telefone</Label>
                  <Input
                    id="church-phone"
                    value={formValues.phone}
                    onChange={(event) =>
                      handleFieldChange("phone", event.target.value)
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="church-email">E-mail</Label>
                  <Input
                    id="church-email"
                    type="email"
                    value={formValues.email}
                    onChange={(event) =>
                      handleFieldChange("email", event.target.value)
                    }
                    placeholder="contato@igreja.org.br"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="church-pastor">Pastor responsavel</Label>
                  <Input
                    id="church-pastor"
                    value={formValues.pastorName}
                    onChange={(event) =>
                      handleFieldChange("pastorName", event.target.value)
                    }
                    placeholder="Nome do pastor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="church-status">Status</Label>
                  <Select
                    id="church-status"
                    value={formValues.status}
                    onChange={(event) =>
                      handleFieldChange("status", event.target.value)
                    }
                  >
                    {CHURCH_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="church-address">Endereco</Label>
                <textarea
                  id="church-address"
                  className={textareaClassName}
                  value={formValues.address}
                  onChange={(event) =>
                    handleFieldChange("address", event.target.value)
                  }
                  placeholder="Endereco completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="church-notes">Observacoes</Label>
                <textarea
                  id="church-notes"
                  className={textareaClassName}
                  value={formValues.notes}
                  onChange={(event) =>
                    handleFieldChange("notes", event.target.value)
                  }
                  placeholder="Observacoes adicionais"
                />
              </div>

              {submitError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isBusy}>
                  {isBusy ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isBusy
                    ? "Salvando..."
                    : mode === "create"
                      ? "Salvar cadastro"
                      : "Salvar alteracoes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(LIST_PATH)}
                  disabled={isBusy}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
