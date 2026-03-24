"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChurchDetailsCard } from "@/modules/churches/components/church-details-card";
import { ChurchesFilters } from "@/modules/churches/components/churches-filters";
import { ChurchesTable } from "@/modules/churches/components/churches-table";
import { getChurchesAccessLabel } from "@/modules/churches/lib/churches-permissions";
import {
  inactivateChurch,
  listChurches,
} from "@/modules/churches/services/churches-service";
import type { AuthUser } from "@/modules/auth/types/auth";
import type { ChurchFilters, ChurchItem } from "@/modules/churches/types/church";

interface ChurchesListPageProps {
  canEdit: boolean;
  currentUser?: AuthUser | null;
}

const initialFilters: ChurchFilters = {
  name: "",
  status: "",
};

export function ChurchesListPage({
  canEdit,
  currentUser,
}: ChurchesListPageProps) {
  const [filters, setFilters] = useState<ChurchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ChurchFilters>(initialFilters);
  const [churches, setChurches] = useState<ChurchItem[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [churchPendingInactivation, setChurchPendingInactivation] =
    useState<ChurchItem | null>(null);

  const loadChurches = useCallback(async (currentFilters: ChurchFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listChurches(currentFilters);
      setChurches(response.items);
      setTotal(response.total);
      if (response.items.length === 0) {
        setIsDetailsOpen(false);
      }
      setSelectedChurchId((current) => {
        if (response.items.length === 0) {
          return null;
        }

        const stillExists = response.items.some((church) => church.id === current);
        return stillExists ? current : response.items[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar a listagem de igrejas.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChurches(appliedFilters);
  }, [appliedFilters, loadChurches]);

  function handleFilterChange(field: keyof ChurchFilters, value: string) {
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

  function handleViewChurch(church: ChurchItem) {
    setSelectedChurchId(church.id);
    setIsDetailsOpen(true);
  }

  async function handleInactivateChurch(church: ChurchItem) {
    setChurchPendingInactivation(church);
  }

  async function confirmInactivateChurch() {
    if (!churchPendingInactivation) {
      return;
    }

    setInactivatingId(churchPendingInactivation.id);
    setError(null);

    try {
      await inactivateChurch(churchPendingInactivation.id);
      await loadChurches(appliedFilters);
      setChurchPendingInactivation(null);
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          "Nao foi possivel inativar a igreja selecionada.",
        ),
      );
    } finally {
      setInactivatingId(null);
    }
  }

  if (error && churches.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel abrir as igrejas"
        description={error}
        onAction={() => void loadChurches(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Igrejas"
        description="Cadastre, acompanhe e consulte as principais informacoes das igrejas."
        badge={getChurchesAccessLabel(currentUser)}
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/igrejas/nova">
                <Plus className="size-4" />
                Nova igreja
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre por nome e status para localizar igrejas rapidamente.
            </CardDescription>
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent>
          <ChurchesFilters
            filters={filters}
            isLoading={isLoading}
            onChange={handleFilterChange}
            onSubmit={handleFilterSubmit}
            onReset={handleResetFilters}
          />
        </CardContent>
      </Card>

      <Card className="bg-white/85">
        <CardHeader className="space-y-2">
          <CardTitle>Listagem</CardTitle>
          <CardDescription>
            Visualize as igrejas cadastradas e acompanhe seus principais dados em um painel lateral.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <ChurchesTable
            churches={churches}
            isLoading={isLoading}
            selectedChurchId={isDetailsOpen ? selectedChurchId : null}
            canEdit={canEdit}
            inactivatingId={inactivatingId}
            onView={handleViewChurch}
            onInactivate={handleInactivateChurch}
          />
        </CardContent>
      </Card>

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Detalhes da igreja</SheetTitle>
            <SheetDescription>
              Visualize as informacoes detalhadas da igreja selecionada.
            </SheetDescription>
          </SheetHeader>

          <ChurchDetailsCard churchId={selectedChurchId} canEdit={canEdit} />
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={Boolean(churchPendingInactivation)}
        title="Inativar igreja"
        description={
          churchPendingInactivation
            ? `A igreja ${churchPendingInactivation.name} deixara de aparecer como ativa para a operacao.`
            : ""
        }
        confirmLabel="Inativar"
        confirmVariant="destructive"
        isLoading={Boolean(
          churchPendingInactivation &&
            inactivatingId === churchPendingInactivation.id,
        )}
        onConfirm={() => void confirmInactivateChurch()}
        onOpenChange={(open) => {
          if (!open) {
            setChurchPendingInactivation(null);
          }
        }}
      />
    </div>
  );
}
