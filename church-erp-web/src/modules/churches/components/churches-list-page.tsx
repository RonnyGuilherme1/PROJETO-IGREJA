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

const feedbackMessages = {
  created: "Igreja cadastrada com sucesso.",
  updated: "Igreja atualizada com sucesso.",
  inactivated: "Igreja inativada com sucesso.",
} as const;

export function ChurchesListPage({
  canEdit,
  currentUser,
}: ChurchesListPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ChurchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ChurchFilters>(initialFilters);
  const [churches, setChurches] = useState<ChurchItem[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
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
        getApiErrorMessage(loadError, "Nao foi possivel carregar as igrejas."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChurches(appliedFilters);
  }, [appliedFilters, loadChurches]);

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
    setFeedback(null);

    try {
      await inactivateChurch(churchPendingInactivation.id);
      await loadChurches(appliedFilters);
      setChurchPendingInactivation(null);
      setFeedback(feedbackMessages.inactivated);
    } catch (actionError) {
      setError(
        getApiErrorMessage(actionError, "Nao foi possivel inativar a igreja."),
      );
    } finally {
      setInactivatingId(null);
    }
  }

  if (error && churches.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel carregar as igrejas"
        description={error}
        onAction={() => void loadChurches(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Igrejas
          </h1>
          <Badge variant="secondary">{getChurchesAccessLabel(currentUser)}</Badge>
        </div>
        {canEdit ? (
          <Button asChild>
            <Link href="/igrejas/nova">
              <Plus className="size-4" />
              Nova igreja
            </Link>
          </Button>
        ) : null}
      </div>

      <Card className="bg-white/85">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
          <CardTitle>Filtros</CardTitle>
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
              onAction={() => void loadChurches(appliedFilters)}
            />
          ) : null}

          {isLoading && churches.length === 0 ? (
            <PageLoading variant="list" />
          ) : (
            <ChurchesTable
              churches={churches}
              isLoading={isLoading}
              selectedChurchId={isDetailsOpen ? selectedChurchId : null}
              canEdit={canEdit}
              inactivatingId={inactivatingId}
              onView={handleViewChurch}
              onInactivate={handleInactivateChurch}
            />
          )}
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
            ? `${churchPendingInactivation.name} sera inativada e continuara disponivel para consulta.`
            : ""
        }
        confirmLabel="Inativar"
        cancelLabel="Voltar"
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
