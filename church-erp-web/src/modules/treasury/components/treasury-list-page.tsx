"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { ErrorView } from "@/components/shared/error-view";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
          "Nao foi possivel carregar as movimentacoes agora.",
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
          "Nao foi possivel carregar categorias e igrejas para os filtros.",
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
          "Nao foi possivel concluir o cancelamento agora.",
        ),
      );
    } finally {
      setCancellingId(null);
    }
  }

  if (error && items.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel carregar a tesouraria"
        description={error}
        onAction={() => void loadMovements(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tesouraria"
        description="Acompanhe entradas e saidas financeiras com visao clara por periodo, categoria e igreja."
        badge={getTreasuryAccessLabel(currentUser)}
        action={
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
        }
      />

      <TreasurySummaryCards summary={summary} />

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre as movimentacoes por periodo, tipo, categoria e igreja.
            </CardDescription>
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {dependenciesError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {dependenciesError}
            </div>
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
        <CardHeader className="space-y-2">
          <CardTitle>Movimentacoes</CardTitle>
          <CardDescription>
            Visualize o historico financeiro e acompanhe categoria, igreja e saldo do periodo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {feedback}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <TreasuryTable
            items={items}
            categoriesById={categoryNamesById}
            churchesById={churchNamesById}
            isLoading={isLoading}
            canEdit={canEdit}
            cancellingId={cancellingId}
            onCancel={handleCancelMovement}
          />
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(movementPendingCancellation)}
        title="Cancelar movimentacao"
        description={
          movementPendingCancellation
            ? `A movimentacao "${movementPendingCancellation.description}" sera marcada como cancelada e permanecera no historico financeiro.`
            : ""
        }
        confirmLabel="Cancelar movimentacao"
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
