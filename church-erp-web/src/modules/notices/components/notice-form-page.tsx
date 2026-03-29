"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { getCampaignById } from "@/modules/campaigns/services/campaigns-service";
import type { CampaignDetailItem } from "@/modules/campaigns/types/campaign";
import { listChurches } from "@/modules/churches/services/churches-service";
import { NoticePreviewCard } from "@/modules/notices/components/notice-preview-card";
import { NoticeSendDialog } from "@/modules/notices/components/notice-send-dialog";
import {
  createNotice,
  getNoticeById,
  uploadNoticeImage,
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
const NOTICE_IMAGE_MAX_FILE_SIZE = 1024 * 1024;
const NOTICE_IMAGE_INPUT_ACCEPT = ".png,.jpg,.jpeg,.webp";
const NOTICE_IMAGE_ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const NOTICE_IMAGE_ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

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

function validateNoticeImageFile(file: File): string | null {
  if (file.size > NOTICE_IMAGE_MAX_FILE_SIZE) {
    return "A imagem do aviso deve ter no maximo 1 MB.";
  }

  const normalizedMimeType = file.type.trim().toLowerCase();
  const normalizedName = file.name.trim().toLowerCase();
  const hasAllowedMimeType =
    normalizedMimeType.length > 0 &&
    NOTICE_IMAGE_ALLOWED_MIME_TYPES.has(normalizedMimeType);
  const hasAllowedExtension = NOTICE_IMAGE_ALLOWED_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );

  if (
    (normalizedMimeType && !hasAllowedMimeType) ||
    (!normalizedMimeType && !hasAllowedExtension) ||
    !hasAllowedExtension
  ) {
    return "Selecione uma imagem PNG, JPG, JPEG ou WEBP.";
  }

  return null;
}

function formatCurrency(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function buildNoticeMessageFromCampaign(campaign: CampaignDetailItem) {
  const normalizedDescription = campaign.description?.trim() ?? "";
  const campaignDetails = [`Contribuicao: ${campaign.installmentCount}x de ${formatCurrency(campaign.installmentAmount)}.`];

  if (campaign.startDate) {
    campaignDetails.push(`Inicio previsto em ${formatDate(campaign.startDate)}.`);
  }

  return [
    `Participe da campanha ${campaign.title}.`,
    normalizedDescription,
    campaignDetails.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function NoticeFormPage({ mode, noticeId }: NoticeFormPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignIdFromQuery = searchParams.get("campaignId")?.trim() ?? "";
  const [formValues, setFormValues] = useState<NoticeFormValues>(initialFormValues);
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>([]);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [campaignPrefillError, setCampaignPrefillError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(
    null,
  );
  const [imageInputKey, setImageInputKey] = useState(0);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      setCampaignPrefillError(null);

      try {
        const [churchesResponse, noticeResponse, campaignResponse] = await Promise.all([
          listChurches({ name: "", status: "" }),
          mode === "edit" && noticeId ? getNoticeById(noticeId) : Promise.resolve(null),
          mode === "create" && campaignIdFromQuery
            ? getCampaignById(campaignIdFromQuery).catch((error) => {
                if (isActive) {
                  setCampaignPrefillError(
                    getApiErrorMessage(
                      error,
                      "Nao foi possivel carregar a campanha para pre-preencher o aviso.",
                    ),
                  );
                }

                return null;
              })
            : Promise.resolve(null),
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
            churchId:
              campaignResponse?.churchId || current.churchId.trim() || singleChurchId,
            title:
              current.title.trim() || campaignResponse?.title || current.title,
            message:
              current.message.trim() ||
              (campaignResponse
                ? buildNoticeMessageFromCampaign(campaignResponse)
                : current.message),
            imageUrl:
              current.imageUrl.trim() || campaignResponse?.imageUrl || current.imageUrl,
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
  }, [campaignIdFromQuery, mode, noticeId]);

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  const selectedChurchName = useMemo(
    () =>
      churchOptions.find((church) => church.id === formValues.churchId)?.name ??
      "Geral",
    [churchOptions, formValues.churchId],
  );
  const previewImageUrl = selectedImagePreviewUrl ?? formValues.imageUrl;
  const previewImageMessage = selectedImageFile
    ? "Preview pronto. Salve para enviar a imagem selecionada para este aviso."
    : formValues.imageUrl.trim()
      ? "Imagem atual configurada para este aviso."
      : "Sem imagem configurada para este aviso.";
  const sendDisabledReason = useMemo(() => {
    if (mode !== "edit" || !noticeId) {
      return "Salve o aviso antes de enviar pelo fluxo centralizado.";
    }

    if (selectedImageFile) {
      return "Salve o aviso para enviar a imagem selecionada nesta edicao.";
    }

    return null;
  }, [mode, noticeId, selectedImageFile]);

  function handleFieldChange(field: keyof NoticeFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetSelectedImageState() {
    setSelectedImageFile(null);
    setImageError(null);
    setImageInputKey((current) => current + 1);
    setSelectedImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });
  }

  function handleImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSubmitError(null);

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationMessage = validateNoticeImageFile(file);

    if (validationMessage) {
      setImageError(validationMessage);
      event.target.value = "";
      return;
    }

    setSelectedImageFile(file);
    setImageError(null);
    setSelectedImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return URL.createObjectURL(file);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    let persistedNoticeId: string | null = null;

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

        const createdNotice = await createNotice(payload);
        persistedNoticeId = createdNotice.id;

        if (selectedImageFile) {
          const uploadResult = await uploadNoticeImage(
            createdNotice.id,
            selectedImageFile,
          );

          setFormValues((current) => ({
            ...current,
            imageUrl: uploadResult.imageUrl,
          }));
          resetSelectedImageState();
        }
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

        const updatedNotice = await updateNotice(noticeId, payload);
        persistedNoticeId = updatedNotice.id;

        if (selectedImageFile) {
          const uploadResult = await uploadNoticeImage(noticeId, selectedImageFile);

          setFormValues((current) => ({
            ...current,
            imageUrl: uploadResult.imageUrl,
          }));
          resetSelectedImageState();
        }
      }

      startTransition(() => {
        router.replace("/avisos");
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          persistedNoticeId && selectedImageFile
            ? mode === "create"
              ? "O aviso foi criado, mas nao foi possivel concluir o envio da imagem. Abra a edicao do aviso para tentar novamente."
              : "As alteracoes do aviso foram salvas, mas nao foi possivel concluir o envio da imagem. Tente novamente na edicao."
            : mode === "create"
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
            ? "Monte avisos com texto, imagem por arquivo, publico alvo e agendamento."
            : "Atualize o aviso mantendo o preview visual e o envio centralizado pelo sistema."
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
              Defina a mensagem, a imagem do aviso e o agendamento. O envio pode ser acionado pelo preview quando o aviso ja existir.
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
                {campaignPrefillError ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
                    {campaignPrefillError}
                  </div>
                ) : null}

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
                    <Label htmlFor="notice-image-file">Imagem do aviso</Label>
                    <Input
                      key={imageInputKey}
                      id="notice-image-file"
                      type="file"
                      accept={NOTICE_IMAGE_INPUT_ACCEPT}
                      onChange={handleImageFileChange}
                      disabled={isSubmitting || isRedirecting}
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Envie PNG, JPG, JPEG ou WEBP com ate 1 MB. O upload da imagem
                      sera feito ao salvar o aviso.
                    </p>
                    {selectedImageFile ? (
                      <p className="text-xs leading-5 text-primary">
                        Arquivo selecionado: <strong>{selectedImageFile.name}</strong>.
                        Salve para aplicar ao aviso.
                      </p>
                    ) : formValues.imageUrl.trim() ? (
                      <p className="text-xs leading-5 text-muted-foreground">
                        O aviso ja possui uma imagem. Selecione outro arquivo para
                        substituir a imagem atual.
                      </p>
                    ) : null}
                    {imageError ? (
                      <p className="text-sm text-destructive">{imageError}</p>
                    ) : null}
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
            imageUrl={previewImageUrl}
            targetLabel={formValues.targetLabel}
            scheduledAt={formValues.scheduledAt}
            status={formValues.status}
            churchName={selectedChurchName}
            imageMessage={previewImageMessage}
            onSendClick={() => setIsSendDialogOpen(true)}
            sendDisabled={
              isLoading ||
              isSubmitting ||
              isRedirecting ||
              Boolean(sendDisabledReason)
            }
            sendHelperText={sendDisabledReason}
          />
        </div>
      </div>

      <NoticeSendDialog
        open={isSendDialogOpen}
        noticeId={noticeId}
        title={formValues.title}
        message={formValues.message}
        imageUrl={formValues.imageUrl}
        scheduledAt={formValues.scheduledAt}
        onOpenChange={setIsSendDialogOpen}
        sendBlockedReason={sendDisabledReason}
      />
    </div>
  );
}
