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
import { listChurches } from "@/modules/churches/services/churches-service";
import { NoticePreviewCard } from "@/modules/notices/components/notice-preview-card";
import {
  createNotice,
  getNoticeById,
  updateNotice,
} from "@/modules/notices/services/notices-service";
import {
  NOTICE_STATUS_OPTIONS,
  type CreateNoticePayload,
  type NoticeFormValues,
  type UpdateNoticePayload,
} from "@/modules/notices/types/notices";

interface NoticeFormPageProps {
  mode: "create" | "edit";
  noticeId?: string;
}

interface ChurchOption {
  id: string;
  name: string;
}

const initialFormValues: NoticeFormValues = {
  churchId: "",
  title: "",
  message: "",
  imageUrl: "",
  targetLabel: "",
  scheduledAt: "",
  status: "DRAFT",
};

const textareaClassName =
  "flex min-h-36 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function formatDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 16);
  }

  const timezoneOffset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function NoticeFormPage({ mode, noticeId }: NoticeFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<NoticeFormValues>(initialFormValues);
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>([]);
  const [isLoading, setIsLoading] = useState(mode === "edit");
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
        const [churchesResponse, noticeResponse] = await Promise.all([
          listChurches({ name: "", status: "" }),
          mode === "edit" && noticeId ? getNoticeById(noticeId) : Promise.resolve(null),
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

        if (noticeResponse) {
          setFormValues({
            churchId: noticeResponse.churchId ?? "",
            title: noticeResponse.title,
            message: noticeResponse.message,
            imageUrl: noticeResponse.imageUrl ?? "",
            targetLabel: noticeResponse.targetLabel ?? "",
            scheduledAt: formatDateTimeInput(noticeResponse.scheduledAt),
            status: noticeResponse.status,
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
                ? "Nao foi possivel carregar os dados iniciais do aviso."
                : "Nao foi possivel carregar os dados do aviso para edicao.",
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
  }, [mode, noticeId]);

  const selectedChurchName = useMemo(
    () =>
      churchOptions.find((church) => church.id === formValues.churchId)?.name ??
      "Geral",
    [churchOptions, formValues.churchId],
  );

  function handleFieldChange(field: keyof NoticeFormValues, value: string) {
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
        const payload: CreateNoticePayload = {
          churchId: formValues.churchId,
          title: formValues.title,
          message: formValues.message,
          imageUrl: formValues.imageUrl,
          targetLabel: formValues.targetLabel,
          scheduledAt: formValues.scheduledAt,
          status: formValues.status,
        };

        await createNotice(payload);
      } else if (noticeId) {
        const payload: UpdateNoticePayload = {
          churchId: formValues.churchId,
          title: formValues.title,
          message: formValues.message,
          imageUrl: formValues.imageUrl,
          targetLabel: formValues.targetLabel,
          scheduledAt: formValues.scheduledAt,
          status: formValues.status,
        };

        await updateNotice(noticeId, payload);
      }

      startTransition(() => {
        router.replace("/avisos");
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Nao foi possivel criar o aviso."
            : "Nao foi possivel salvar as alteracoes do aviso.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <ErrorView
        title="Nao foi possivel abrir este aviso"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Novo aviso" : "Editar aviso"}
        description={
          mode === "create"
            ? "Monte avisos manuais com texto, imagem por URL, publico alvo e agendamento."
            : "Atualize o aviso mantendo o preview manual e sem qualquer envio automatico."
        }
        badge="Avisos"
        action={
          <Button asChild variant="outline">
            <Link href="/avisos">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="bg-white/85">
          <CardHeader>
            <CardTitle>
              {mode === "create" ? "Cadastro de aviso" : "Edicao de aviso"}
            </CardTitle>
            <CardDescription>
              Defina a mensagem, a imagem por URL e o agendamento. O uso permanece manual neste passo.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <Label htmlFor="notice-title">Titulo</Label>
                    <Input
                      id="notice-title"
                      value={formValues.title}
                      onChange={(event) =>
                        handleFieldChange("title", event.target.value)
                      }
                      placeholder="Titulo do aviso"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notice-church">Igreja</Label>
                    <Select
                      id="notice-church"
                      value={formValues.churchId}
                      onChange={(event) =>
                        handleFieldChange("churchId", event.target.value)
                      }
                    >
                      <option value="">Geral</option>
                      {churchOptions.map((church) => (
                        <option key={church.id} value={church.id}>
                          {church.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notice-status">Status</Label>
                    <Select
                      id="notice-status"
                      value={formValues.status}
                      onChange={(event) =>
                        handleFieldChange("status", event.target.value)
                      }
                    >
                      {NOTICE_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notice-target-label">Publico alvo</Label>
                    <Input
                      id="notice-target-label"
                      value={formValues.targetLabel}
                      onChange={(event) =>
                        handleFieldChange("targetLabel", event.target.value)
                      }
                      placeholder="Ex.: Jovens, Mulheres, Geral"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notice-scheduled-at">Data agendada</Label>
                    <Input
                      id="notice-scheduled-at"
                      type="datetime-local"
                      value={formValues.scheduledAt}
                      onChange={(event) =>
                        handleFieldChange("scheduledAt", event.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notice-image-url">Image URL</Label>
                    <Input
                      id="notice-image-url"
                      type="url"
                      value={formValues.imageUrl}
                      onChange={(event) =>
                        handleFieldChange("imageUrl", event.target.value)
                      }
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notice-message">Mensagem</Label>
                  <textarea
                    id="notice-message"
                    className={textareaClassName}
                    value={formValues.message}
                    onChange={(event) =>
                      handleFieldChange("message", event.target.value)
                    }
                    placeholder="Escreva a mensagem manual do aviso"
                    required
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
                    {mode === "create" ? "Criar aviso" : "Salvar alteracoes"}
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/avisos">Cancelar</Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="xl:sticky xl:top-6">
          <NoticePreviewCard
            title={formValues.title}
            message={formValues.message}
            imageUrl={formValues.imageUrl}
            targetLabel={formValues.targetLabel}
            scheduledAt={formValues.scheduledAt}
            status={formValues.status}
            churchName={selectedChurchName}
          />
        </div>
      </div>
    </div>
  );
}
