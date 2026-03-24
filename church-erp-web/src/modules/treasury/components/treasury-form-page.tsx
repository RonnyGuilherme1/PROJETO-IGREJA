"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
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
import {
  createTreasuryMovement,
  getTreasuryMovementById,
  listTreasuryCategories,
  updateTreasuryMovement,
} from "@/modules/treasury/services/treasury-service";
import {
  TREASURY_STATUS_OPTIONS,
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

const initialFormValues: TreasuryFormValues = {
  churchId: "",
  categoryId: "",
  type: "ENTRY",
  description: "",
  amount: "",
  transactionDate: "",
  notes: "",
  status: "ACTIVE",
};

const textareaClassName =
  "flex min-h-28 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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
  const [isRedirecting, startTransition] = useTransition();
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
            amount: String(movementResponse.amount),
            transactionDate: movementResponse.transactionDate,
            notes: movementResponse.notes,
            status: movementResponse.status || "ACTIVE",
          });
        }
      } catch (error) {
        if (isActive) {
          setLoadError(
            getApiErrorMessage(
              error,
              mode === "create"
                ? "Nao foi possivel carregar os dados iniciais da movimentacao."
                : "Nao foi possivel carregar a movimentacao para edicao.",
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
      const payload = {
        churchId: formValues.churchId,
        categoryId: formValues.categoryId,
        type: formValues.type,
        description: formValues.description,
        amount: Number(formValues.amount),
        transactionDate: formValues.transactionDate,
        notes: formValues.notes,
      };

      if (mode === "create") {
        await createTreasuryMovement(payload as CreateTreasuryPayload);
      } else if (movementId) {
        await updateTreasuryMovement(movementId, {
          ...(payload as UpdateTreasuryPayload),
          status: formValues.status,
        });
      }

      startTransition(() => {
        router.replace("/tesouraria");
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Nao foi possivel criar a movimentacao."
            : "Nao foi possivel salvar as alteracoes da movimentacao.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <ErrorView
        title="Falha ao carregar movimentacao"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Nova movimentacao" : "Editar movimentacao"}
        description={
          mode === "create"
            ? "Cadastre uma nova entrada ou saida financeira vinculando igreja e categoria."
            : "Atualize a movimentacao financeira mantendo o padrao administrativo do sistema."
        }
        badge="Modulo de tesouraria"
        action={
          <Button asChild variant="outline">
            <Link href="/tesouraria">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Cadastro financeiro" : "Edicao financeira"}
          </CardTitle>
          <CardDescription>
            Preencha os dados da movimentacao para manter o controle financeiro organizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
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
                    {categories.map((category) => (
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
                    O tipo e definido automaticamente pela categoria selecionada.
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
                    placeholder="Descricao da movimentacao"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treasury-transactionDate">Data da movimentacao</Label>
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

                {mode === "edit" ? (
                  <div className="space-y-2">
                    <Label htmlFor="treasury-status">Status</Label>
                    <Select
                      id="treasury-status"
                      value={formValues.status}
                      onChange={(event) =>
                        handleFieldChange("status", event.target.value)
                      }
                    >
                      {TREASURY_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
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
                  placeholder="Observacoes adicionais"
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
                  {mode === "create"
                    ? "Criar movimentacao"
                    : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/tesouraria">Cancelar</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
