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
import { listChurches } from "@/modules/churches/services/churches-service";
import {
  createTreasuryMovement,
  getTreasuryMovementById,
  listTreasuryCategories,
  updateTreasuryMovement,
} from "@/modules/treasury/services/treasury-service";
import {
  TREASURY_TYPE_OPTIONS,
  type CreateTreasuryPayload,
  type TreasuryCategoryItem,
  type TreasuryFormValues,
  type UpdateTreasuryPayload,
} from "@/modules/treasury/types/treasury";

interface TreasuryFormPageProps {
  mode: "create" | "edit";
  movementId?: string;
}

interface ChurchOption {
  id: string;
  name: string;
}

const TREASURY_RECEIPT_MAX_FILE_SIZE = 5 * 1024 * 1024;
const TREASURY_RECEIPT_INPUT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";
const TREASURY_RECEIPT_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const TREASURY_RECEIPT_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

const initialFormValues: TreasuryFormValues = {
  churchId: "",
  categoryId: "",
  type: "ENTRY",
  description: "",
  amount: "",
  transactionDate: "",
  notes: "",
  receiptUrl: "",
  status: "ACTIVE",
};

const textareaClassName =
  "flex min-h-28 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const LIST_PATH = "/tesouraria";

function validateTreasuryReceiptFile(file: File): string | null {
  if (file.size > TREASURY_RECEIPT_MAX_FILE_SIZE) {
    return "O comprovante deve ter no maximo 5 MB.";
  }

  const normalizedMimeType = file.type.trim().toLowerCase();
  const normalizedName = file.name.trim().toLowerCase();
  const hasAllowedMimeType =
    normalizedMimeType.length > 0 &&
    TREASURY_RECEIPT_ALLOWED_MIME_TYPES.has(normalizedMimeType);
  const hasAllowedExtension = TREASURY_RECEIPT_ALLOWED_EXTENSIONS.some(
    (extension) => normalizedName.endsWith(extension),
  );

  if (
    (normalizedMimeType && !hasAllowedMimeType) ||
    (!normalizedMimeType && !hasAllowedExtension) ||
    !hasAllowedExtension
  ) {
    return "Selecione um PDF, PNG, JPG, JPEG ou WEBP.";
  }

  return null;
}

export function TreasuryFormPage({
  mode,
  movementId,
}: TreasuryFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<TreasuryFormValues>(initialFormValues);
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [categories, setCategories] = useState<TreasuryCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptInputKey, setReceiptInputKey] = useState(0);
  const [isRedirecting, startTransition] = useTransition();
  const availableCategories = categories.filter(
    (category) => category.active || category.id === formValues.categoryId,
  );
  const selectedCategory = categories.find(
    (category) => category.id === formValues.categoryId,
  );
  const selectedTypeOption = TREASURY_TYPE_OPTIONS.find(
    (option) => option.value === formValues.type,
  );

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [churchesResponse, categoriesResponse, movementResponse] =
          await Promise.all([
            listChurches({ name: "", status: "" }),
            listTreasuryCategories(),
            mode === "edit" && movementId
              ? getTreasuryMovementById(movementId)
              : Promise.resolve(null),
          ]);

        if (!isActive) {
          return;
        }

        setChurches(
          churchesResponse.items.map((church) => ({
            id: church.id,
            name: church.name,
          })),
        );
        setCategories(categoriesResponse);

        if (movementResponse) {
          setFormValues({
            churchId: movementResponse.churchId,
            categoryId: movementResponse.categoryId,
            type: movementResponse.type || "ENTRY",
            description: movementResponse.description,
            amount: movementResponse.amount,
            transactionDate: movementResponse.transactionDate.slice(0, 10),
            notes: movementResponse.notes ?? "",
            receiptUrl: movementResponse.receiptUrl ?? "",
            status: movementResponse.status || "ACTIVE",
          });
        }
      } catch (error) {
        if (isActive) {
          setLoadError(
            getApiErrorMessage(
              error,
              mode === "create"
                ? "Nao foi possivel preparar o formulario."
                : "Nao foi possivel carregar os dados da movimentacao.",
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
  }, [mode, movementId]);

  function handleFieldChange(field: keyof TreasuryFormValues, value: string) {
    if (submitError) {
      setSubmitError(null);
    }

    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleCategoryChange(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId);

    setFormValues((current) => ({
      ...current,
      categoryId,
      type: category?.type ?? current.type,
    }));
  }

  function resetSelectedReceiptState() {
    setSelectedReceiptFile(null);
    setReceiptError(null);
    setReceiptInputKey((current) => current + 1);
  }

  function handleReceiptFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSubmitError(null);

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationMessage = validateTreasuryReceiptFile(file);

    if (validationMessage) {
      setSelectedReceiptFile(null);
      setReceiptError(validationMessage);
      event.target.value = "";
      return;
    }

    setSelectedReceiptFile(file);
    setReceiptError(null);
  }

  function handleRemoveReceipt() {
    resetSelectedReceiptState();
    setFormValues((current) => ({
      ...current,
      receiptUrl: "",
    }));
  }

  useEffect(() => {
    if (!formValues.categoryId) {
      return;
    }

    const category = categories.find((item) => item.id === formValues.categoryId);

    if (!category || category.type === formValues.type) {
      return;
    }

    setFormValues((current) => ({
      ...current,
      type: category.type,
    }));
  }, [categories, formValues.categoryId, formValues.type]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateTreasuryPayload = {
        churchId: formValues.churchId,
        categoryId: formValues.categoryId,
        type: formValues.type,
        description: formValues.description,
        amount: formValues.amount,
        transactionDate: formValues.transactionDate,
        notes: formValues.notes,
        receiptUrl: formValues.receiptUrl,
      };

      if (mode === "create") {
        await createTreasuryMovement(payload, selectedReceiptFile);
      } else if (movementId) {
        const updatePayload: UpdateTreasuryPayload = payload;
        await updateTreasuryMovement(
          movementId,
          updatePayload,
          selectedReceiptFile,
        );
      }

      startTransition(() => {
        router.replace(
          `${LIST_PATH}?feedback=${mode === "create" ? "created" : "updated"}`,
        );
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Nao foi possivel salvar os dados."),
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
        title={mode === "create" ? "Nova movimentacao" : "Editar movimentacao"}
        description="Preencha os dados essenciais da movimentacao financeira."
        badge="Tesouraria"
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
          <CardTitle>Dados principais</CardTitle>
          <CardDescription>
            Cadastre a movimentacao com categoria, periodo e comprovante quando
            houver.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading variant="form" fields={9} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="treasury-churchId">Igreja</Label>
                  <Select
                    id="treasury-churchId"
                    value={formValues.churchId}
                    onChange={(event) =>
                      handleFieldChange("churchId", event.target.value)
                    }
                    required
                  >
                    <option value="">Selecione uma igreja</option>
                    {churches.map((church) => (
                      <option key={church.id} value={church.id}>
                        {church.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treasury-categoryId">Categoria</Label>
                  <Select
                    id="treasury-categoryId"
                    value={formValues.categoryId}
                    onChange={(event) => handleCategoryChange(event.target.value)}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treasury-type">Tipo</Label>
                  <Input
                    id="treasury-type"
                    value={
                      selectedCategory
                        ? selectedTypeOption?.label || ""
                        : "Selecione uma categoria"
                    }
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Definido pela categoria.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treasury-amount">Valor</Label>
                  <Input
                    id="treasury-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formValues.amount}
                    onChange={(event) =>
                      handleFieldChange("amount", event.target.value)
                    }
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="treasury-description">Descricao</Label>
                  <Input
                    id="treasury-description"
                    value={formValues.description}
                    onChange={(event) =>
                      handleFieldChange("description", event.target.value)
                    }
                    placeholder="Ex.: Oferta de domingo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treasury-transactionDate">
                    Data da movimentacao
                  </Label>
                  <Input
                    id="treasury-transactionDate"
                    type="date"
                    value={formValues.transactionDate}
                    onChange={(event) =>
                      handleFieldChange("transactionDate", event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {mode === "edit" ? (
                <div className="rounded-2xl border border-border bg-secondary/35 px-4 py-3 text-sm text-muted-foreground">
                  Status atual:{" "}
                  <strong>
                    {formValues.status === "CANCELLED" ? "Cancelada" : "Ativa"}
                  </strong>
                  . Para cancelar, use a listagem.
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="treasury-receipt">Comprovante ou anexo</Label>
                <Input
                  key={receiptInputKey}
                  id="treasury-receipt"
                  type="file"
                  accept={TREASURY_RECEIPT_INPUT_ACCEPT}
                  onChange={handleReceiptFileChange}
                  disabled={isBusy}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Aceita PDF, PNG, JPG, JPEG ou WEBP com ate 5 MB.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveReceipt}
                    disabled={isBusy}
                  >
                    Remover comprovante
                  </Button>
                </div>
                {selectedReceiptFile ? (
                  <p className="text-xs text-primary">
                    Arquivo selecionado:{" "}
                    <strong>{selectedReceiptFile.name}</strong>. Salve para
                    substituir o comprovante atual.
                  </p>
                ) : null}
                {!selectedReceiptFile && formValues.receiptUrl ? (
                  <a
                    href={formValues.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Abrir comprovante atual
                  </a>
                ) : null}
                {receiptError ? (
                  <p className="text-sm text-destructive">{receiptError}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="treasury-notes">Observacoes</Label>
                <textarea
                  id="treasury-notes"
                  className={textareaClassName}
                  value={formValues.notes}
                  onChange={(event) =>
                    handleFieldChange("notes", event.target.value)
                  }
                  placeholder="Observacoes internas"
                />
              </div>

              {submitError ? (
                <ErrorView
                  variant="inline"
                  title="Nao foi possivel salvar"
                  description={submitError}
                />
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isBusy}>
                  {isBusy ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isBusy ? "Salvando..." : "Salvar"}
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
