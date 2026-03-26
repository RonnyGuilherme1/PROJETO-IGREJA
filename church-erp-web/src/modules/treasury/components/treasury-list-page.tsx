"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { ErrorView } from "@/components/shared/error-view";
import { PageLoading } from "@/components/shared/page-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listChurches } from "@/modules/churches/services/churches-service";
import { TreasuryCategoriesSheet } from "@/modules/treasury/components/treasury-categories-sheet";
import { TreasuryFilters } from "@/modules/treasury/components/treasury-filters";
import { TreasurySummaryCards } from "@/modules/treasury/components/treasury-summary-cards";
import { TreasuryTable } from "@/modules/treasury/components/treasury-table";
import { getTreasuryAccessLabel } from "@/modules/treasury/lib/treasury-permissions";
import {
  cancelTreasuryMovement,
  closeTreasuryMonth,
  exportTreasuryMovements,
  getTreasuryMonthlyClosureStatus,
  listTreasuryCategories,
  listTreasuryMovements,
  type TreasuryMonthlyClosureStatus,
} from "@/modules/treasury/services/treasury-service";
import type { AuthUser } from "@/modules/auth/types/auth";
import type {
  TreasuryCategoryItem,
  TreasuryFilters as TreasuryFiltersType,
  TreasuryMovementItem,
  TreasurySummary,
} from "@/modules/treasury/types/treasury";

interface TreasuryListPageProps {
  canEdit: boolean;
  currentUser?: AuthUser | null;
}

interface ChurchOption {
  id: string;
  name: string;
}

interface MonthReference {
  year: number;
  month: number;
  label: string;
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getCurrentMonthDateRange() {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
  };
}

function getMonthReferenceFromFilters(
  filters: TreasuryFiltersType,
): MonthReference | null {
  if (!filters.startDate || !filters.endDate) {
    return null;
  }

  const startParts = filters.startDate.split("-").map(Number);
  const endParts = filters.endDate.split("-").map(Number);

  if (startParts.length !== 3 || endParts.length !== 3) {
    return null;
  }

  const [startYear, startMonth] = startParts;
  const [endYear, endMonth] = endParts;

  if (
    !Number.isInteger(startYear) ||
    !Number.isInteger(startMonth) ||
    !Number.isInteger(endYear) ||
    !Number.isInteger(endMonth) ||
    startYear !== endYear ||
    startMonth !== endMonth
  ) {
    return null;
  }

  return {
    year: startYear,
    month: startMonth,
    label: `${String(startMonth).padStart(2, "0")}/${startYear}`,
  };
}

function isFullMonthFilter(
  filters: TreasuryFiltersType,
  monthReference: MonthReference | null,
) {
  if (!monthReference) {
    return false;
  }

  const lastDayOfMonth = new Date(
    Date.UTC(monthReference.year, monthReference.month, 0),
  )
    .getUTCDate()
    .toString()
    .padStart(2, "0");

  return (
    filters.startDate ===
      `${monthReference.year}-${String(monthReference.month).padStart(2, "0")}-01` &&
    filters.endDate ===
      `${monthReference.year}-${String(monthReference.month).padStart(2, "0")}-${lastDayOfMonth}`
  );
}

function hasScopedClosureFilters(filters: TreasuryFiltersType) {
  return Boolean(
    filters.type || filters.categoryId || filters.churchId || filters.status,
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedValue);
}

function downloadExportedFile(file: { blob: Blob; filename: string }) {
  const objectUrl = window.URL.createObjectURL(file.blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

const stableInitialFilters: TreasuryFiltersType = {
  startDate: "",
  endDate: "",
  type: "",
  categoryId: "",
  churchId: "",
  status: "",
};

const emptySummary: TreasurySummary = {
  income: 0,
  expense: 0,
  balance: 0,
  transactionCount: 0,
};

const feedbackMessages = {
  created: "Movimentacao cadastrada com sucesso.",
  updated: "Movimentacao atualizada com sucesso.",
  cancelled: "Movimentacao cancelada com sucesso.",
} as const;

function areTreasuryFiltersEqual(
  left: TreasuryFiltersType,
  right: TreasuryFiltersType,
) {
  return (
    left.startDate === right.startDate &&
    left.endDate === right.endDate &&
    left.type === right.type &&
    left.categoryId === right.categoryId &&
    left.churchId === right.churchId &&
    left.status === right.status
  );
}

export function TreasuryListPage({
  canEdit,
  currentUser,
}: TreasuryListPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] =
    useState<TreasuryFiltersType>(stableInitialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<TreasuryFiltersType>(stableInitialFilters);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [defaultDateRange, setDefaultDateRange] =
    useState<TreasuryFiltersType>(stableInitialFilters);
  const [items, setItems] = useState<TreasuryMovementItem[]>([]);
  const [categories, setCategories] = useState<TreasuryCategoryItem[]>([]);
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [summary, setSummary] = useState<TreasurySummary>(emptySummary);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isMonthClosureLoading, setIsMonthClosureLoading] = useState(false);
  const [isClosingMonth, setIsClosingMonth] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dependenciesError, setDependenciesError] = useState<string | null>(null);
  const [monthClosureError, setMonthClosureError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [monthClosure, setMonthClosure] =
    useState<TreasuryMonthlyClosureStatus | null>(null);
  const [movementPendingCancellation, setMovementPendingCancellation] =
    useState<TreasuryMovementItem | null>(null);
  const [monthPendingClosure, setMonthPendingClosure] =
    useState<MonthReference | null>(null);
  const filtersControlsLoading = Boolean(isLoading);
  const summaryActionsReady = Boolean(hasInitialized);
  const categoryNamesById = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  );
  const churchNamesById = Object.fromEntries(
    churches.map((church) => [church.id, church.name]),
  );
  const summaryPeriodLabel =
    defaultDateRange.startDate &&
    defaultDateRange.endDate &&
    appliedFilters.startDate === defaultDateRange.startDate &&
    appliedFilters.endDate === defaultDateRange.endDate
      ? "do mes"
      : "do periodo";
  const monthReference = getMonthReferenceFromFilters(appliedFilters);
  const fullMonthSelected = isFullMonthFilter(appliedFilters, monthReference);
  const hasScopedFilters = hasScopedClosureFilters(appliedFilters);
  const isMonthClosed = Boolean(monthReference && monthClosure?.closed);
  const canCloseMonth = Boolean(
    canEdit &&
      monthReference &&
      fullMonthSelected &&
      !hasScopedFilters &&
      !monthClosure?.closed,
  );

  let closureLabel = "Selecione um mes";
  let closureDescription =
    "O fechamento mensal aparece quando o filtro cobre um unico mes.";

  if (monthClosureError) {
    closureLabel = "Indisponivel";
    closureDescription = monthClosureError;
  } else if (monthReference && monthClosure?.closed) {
    closureLabel = `Fechado ${monthReference.label}`;
    closureDescription = `Fechado em ${formatDateTime(monthClosure.closedAt)}. As movimentacoes desse mes ficam congeladas para edicao e cancelamento.`;
  } else if (monthReference && !fullMonthSelected) {
    closureLabel = `Aberto ${monthReference.label}`;
    closureDescription =
      "Para fechar o mes, selecione o periodo completo do primeiro ao ultimo dia.";
  } else if (monthReference && hasScopedFilters) {
    closureLabel = `Aberto ${monthReference.label}`;
    closureDescription =
      "Remova igreja, categoria, tipo e status para fechar o mes completo sem recortes.";
  } else if (monthReference) {
    closureLabel = `Aberto ${monthReference.label}`;
    closureDescription =
      "O mes ainda nao foi fechado. Ao fechar, o resumo do mes e salvo e novas alteracoes ficam bloqueadas.";
  }

  const loadMovements = useCallback(async (currentFilters: TreasuryFiltersType) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listTreasuryMovements(currentFilters);
      setItems(response.items);
      setTotal(response.total);
      setSummary(response.summary);
      setHasLoadedOnce(true);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar as movimentacoes.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const nextDateRange = getCurrentMonthDateRange();
    const nextFilters = {
      ...stableInitialFilters,
      startDate: nextDateRange.startDate,
      endDate: nextDateRange.endDate,
    };

    setDefaultDateRange(nextFilters);
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setHasInitialized(true);
  }, []);

  useEffect(() => {
    if (!hasInitialized || !appliedFilters.startDate || !appliedFilters.endDate) {
      return;
    }

    void loadMovements(appliedFilters);
  }, [appliedFilters, hasInitialized, loadMovements]);

  useEffect(() => {
    const feedbackKey = searchParams.get("feedback");

    if (!feedbackKey || !(feedbackKey in feedbackMessages)) {
      return;
    }

    setFeedback(feedbackMessages[feedbackKey as keyof typeof feedbackMessages]);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("feedback");
    router.replace(
      nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname,
      { scroll: false },
    );
  }, [pathname, router, searchParams]);

  useEffect(() => {
    let isActive = true;

    async function loadDependencies() {
      setIsCategoriesLoading(true);
      setDependenciesError(null);

      try {
        const [categoriesResponse, churchesResponse] = await Promise.all([
          listTreasuryCategories(),
          listChurches({ name: "", status: "" }),
        ]);

        if (!isActive) {
          return;
        }

        setCategories(categoriesResponse);
        setChurches(
          churchesResponse.items.map((church) => ({
            id: church.id,
            name: church.name,
          })),
        );
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message = getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar as opcoes de filtro.",
        );

        setDependenciesError(message);
      } finally {
        if (isActive) {
          setIsCategoriesLoading(false);
        }
      }
    }

    void loadDependencies();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasInitialized) {
      return;
    }

    let isActive = true;
    const reference = getMonthReferenceFromFilters(appliedFilters);

    async function loadMonthClosureStatus(reference: MonthReference) {
      setIsMonthClosureLoading(true);
      setMonthClosureError(null);
      setMonthClosure(null);

      try {
        const response = await getTreasuryMonthlyClosureStatus(
          reference.year,
          reference.month,
        );

        if (!isActive) {
          return;
        }

        setMonthClosure(response);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setMonthClosureError(
          getApiErrorMessage(
            loadError,
            "Nao foi possivel consultar o fechamento mensal.",
          ),
        );
      } finally {
        if (isActive) {
          setIsMonthClosureLoading(false);
        }
      }
    }

    if (!reference) {
      setMonthClosure(null);
      setMonthClosureError(null);
      setIsMonthClosureLoading(false);
      return () => {
        isActive = false;
      };
    }

    void loadMonthClosureStatus(reference);

    return () => {
      isActive = false;
    };
  }, [appliedFilters, hasInitialized]);

  function handleFilterChange(field: keyof TreasuryFiltersType, value: string) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (areTreasuryFiltersEqual(filters, appliedFilters)) {
      return;
    }

    setAppliedFilters({ ...filters });
  }

  function handleResetFilters() {
    const nextFilters =
      defaultDateRange.startDate && defaultDateRange.endDate
        ? defaultDateRange
        : stableInitialFilters;

    if (
      areTreasuryFiltersEqual(filters, nextFilters) &&
      areTreasuryFiltersEqual(appliedFilters, nextFilters)
    ) {
      return;
    }

    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }

  async function handleCancelMovement(item: TreasuryMovementItem) {
    setMovementPendingCancellation(item);
  }

  async function confirmCancelMovement() {
    if (!movementPendingCancellation) {
      return;
    }

    setCancellingId(movementPendingCancellation.id);
    setError(null);
    setFeedback(null);

    try {
      await cancelTreasuryMovement(movementPendingCancellation.id);
      await loadMovements(appliedFilters);
      setMovementPendingCancellation(null);
      setFeedback(feedbackMessages.cancelled);
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          "Nao foi possivel cancelar a movimentacao.",
        ),
      );
    } finally {
      setCancellingId(null);
    }
  }

  function handleCloseMonthRequest() {
    if (!monthReference || !canCloseMonth) {
      return;
    }

    setMonthPendingClosure(monthReference);
  }

  async function confirmCloseMonth() {
    if (!monthPendingClosure) {
      return;
    }

    setIsClosingMonth(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await closeTreasuryMonth(
        monthPendingClosure.year,
        monthPendingClosure.month,
      );

      setMonthClosure(response);
      setMonthClosureError(null);
      await loadMovements(appliedFilters);
      setMonthPendingClosure(null);
      setFeedback(`Mes ${monthPendingClosure.label} fechado com sucesso.`);
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          "Nao foi possivel fechar o mes selecionado.",
        ),
      );
    } finally {
      setIsClosingMonth(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    setError(null);
    setFeedback(null);

    try {
      const exportedFile = await exportTreasuryMovements(appliedFilters);
      downloadExportedFile(exportedFile);
      setFeedback("Exportacao CSV concluida com sucesso.");
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          "Nao foi possivel exportar a listagem financeira.",
        ),
      );
    } finally {
      setIsExporting(false);
    }
  }

  const showInitialLoading = !hasInitialized || (!hasLoadedOnce && isLoading);

  if (error && !hasLoadedOnce && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel carregar as movimentacoes"
        description={error}
        onAction={() => void loadMovements(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Tesouraria
          </h1>
          <Badge variant="secondary">{getTreasuryAccessLabel(currentUser)}</Badge>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <TreasuryCategoriesSheet
            categories={categories}
            isLoading={isCategoriesLoading}
            error={dependenciesError}
          />
          {canEdit ? (
            <Button asChild>
              <Link href="/tesouraria/nova">
                <Plus className="size-4" />
                Nova movimentacao
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <TreasurySummaryCards
        summary={summary}
        periodLabel={summaryPeriodLabel}
        closureLabel={closureLabel}
        closureDescription={closureDescription}
        actionsReady={summaryActionsReady}
        isClosureLoading={isMonthClosureLoading}
        isMonthClosed={isMonthClosed}
        showCloseAction={canEdit}
        canCloseMonth={canCloseMonth}
        isClosingMonth={isClosingMonth}
        isExporting={isExporting}
        onCloseMonth={handleCloseMonthRequest}
        onExport={() => void handleExport()}
      />

      <Card className="bg-white/85">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
          <CardTitle>Filtros</CardTitle>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {dependenciesError ? (
            <ErrorView
              variant="inline"
              title="Filtros indisponiveis"
              description={dependenciesError}
            />
          ) : null}

          {hasInitialized ? (
            <TreasuryFilters
              filters={filters}
              categories={categories}
              churches={churches}
              isLoading={filtersControlsLoading}
              onChange={handleFilterChange}
              onSubmit={handleFilterSubmit}
              onReset={handleResetFilters}
            />
          ) : (
            <div
              aria-hidden="true"
              className="rounded-2xl border border-dashed border-border/80 bg-secondary/20 px-4 py-6 text-sm text-muted-foreground"
            >
              Preparando filtros...
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/85">
        <CardHeader className="pb-4">
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {feedback}
            </div>
          ) : null}

          {error ? (
            <ErrorView
              variant="inline"
              title="Nao foi possivel atualizar a listagem"
              description={error}
              actionLabel="Recarregar listagem"
              onAction={() => void loadMovements(appliedFilters)}
            />
          ) : null}

          {showInitialLoading ? (
            <PageLoading variant="list" />
          ) : (
            <TreasuryTable
              items={items}
              categoriesById={categoryNamesById}
              churchesById={churchNamesById}
              isLoading={isLoading}
              canEdit={canEdit}
              isMonthClosed={isMonthClosed}
              cancellingId={cancellingId}
              onCancel={handleCancelMovement}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(movementPendingCancellation)}
        title="Cancelar movimentacao"
        description={
          movementPendingCancellation
            ? `A movimentacao "${movementPendingCancellation.description}" sera cancelada e continuara no historico financeiro.`
            : ""
        }
        confirmLabel="Cancelar"
        cancelLabel="Voltar"
        confirmVariant="destructive"
        isLoading={Boolean(
          movementPendingCancellation &&
            cancellingId === movementPendingCancellation.id,
        )}
        onConfirm={() => void confirmCancelMovement()}
        onOpenChange={(open) => {
          if (!open) {
            setMovementPendingCancellation(null);
          }
        }}
      />

      <ConfirmActionDialog
        open={Boolean(monthPendingClosure)}
        title="Fechar mes financeiro"
        description={
          monthPendingClosure
            ? `O mes ${monthPendingClosure.label} sera fechado com o resumo atual e nao tera reabertura por esta tela.`
            : ""
        }
        confirmLabel="Fechar mes"
        cancelLabel="Voltar"
        isLoading={isClosingMonth}
        onConfirm={() => void confirmCloseMonth()}
        onOpenChange={(open) => {
          if (!open) {
            setMonthPendingClosure(null);
          }
        }}
      />
    </div>
  );
}
