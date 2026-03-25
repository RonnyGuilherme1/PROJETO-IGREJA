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
  listTreasuryCategories,
  listTreasuryMovements,
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

const initialFilters: TreasuryFiltersType = {
  startDate: "",
  endDate: "",
  type: "",
  categoryId: "",
  churchId: "",
};

const emptySummary: TreasurySummary = {
  income: 0,
  expense: 0,
  balance: 0,
};

const feedbackMessages = {
  created: "Movimentacao cadastrada com sucesso.",
  updated: "Movimentacao atualizada com sucesso.",
  cancelled: "Movimentacao cancelada com sucesso.",
} as const;

export function TreasuryListPage({
  canEdit,
  currentUser,
}: TreasuryListPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TreasuryFiltersType>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<TreasuryFiltersType>(initialFilters);
  const [items, setItems] = useState<TreasuryMovementItem[]>([]);
  const [categories, setCategories] = useState<TreasuryCategoryItem[]>([]);
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [summary, setSummary] = useState<TreasurySummary>(emptySummary);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dependenciesError, setDependenciesError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [movementPendingCancellation, setMovementPendingCancellation] =
    useState<TreasuryMovementItem | null>(null);
  const categoryNamesById = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  );
  const churchNamesById = Object.fromEntries(
    churches.map((church) => [church.id, church.name]),
  );

  const loadMovements = useCallback(async (currentFilters: TreasuryFiltersType) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listTreasuryMovements(currentFilters);
      setItems(response.items);
      setTotal(response.total);
      setSummary(response.summary);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar as movimentacoes.",
        ),
      );
      setSummary(emptySummary);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMovements(appliedFilters);
  }, [appliedFilters, loadMovements]);

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

  function handleFilterChange(field: keyof TreasuryFiltersType, value: string) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
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

  if (error && items.length === 0 && !isLoading) {
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

      <TreasurySummaryCards summary={summary} />

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

          <TreasuryFilters
            filters={filters}
            categories={categories}
            churches={churches}
            isLoading={isLoading}
            onChange={handleFilterChange}
            onSubmit={handleFilterSubmit}
            onReset={handleResetFilters}
          />
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

          {isLoading && items.length === 0 ? (
            <PageLoading variant="list" />
          ) : (
            <TreasuryTable
              items={items}
              categoriesById={categoryNamesById}
              churchesById={churchNamesById}
              isLoading={isLoading}
              canEdit={canEdit}
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
    </div>
  );
}
