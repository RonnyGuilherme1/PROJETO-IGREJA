"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
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
import { ChurchDetailsCard } from "@/modules/churches/components/church-details-card";
import { ChurchesFilters } from "@/modules/churches/components/churches-filters";
import { ChurchesTable } from "@/modules/churches/components/churches-table";
import { getChurchesAccessLabel } from "@/modules/churches/lib/churches-permissions";
import { listChurches } from "@/modules/churches/services/churches-service";
import type { ChurchFilters, ChurchItem } from "@/modules/churches/types/church";

interface ChurchesListPageProps {
  canEdit: boolean;
  currentProfile?: string;
}

const initialFilters: ChurchFilters = {
  name: "",
  status: "",
};

export function ChurchesListPage({
  canEdit,
  currentProfile,
}: ChurchesListPageProps) {
  const [filters, setFilters] = useState<ChurchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ChurchFilters>(initialFilters);
  const [churches, setChurches] = useState<ChurchItem[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChurches = useCallback(async (currentFilters: ChurchFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listChurches(currentFilters);
      setChurches(response.items);
      setTotal(response.total);
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

  if (error && churches.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Falha ao carregar igrejas"
        description={error}
        onAction={() => void loadChurches(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Igrejas"
        description="Cadastre, acompanhe e visualize os dados principais das igrejas em uma estrutura administrativa limpa."
        badge={getChurchesAccessLabel(currentProfile)}
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
          <Badge variant="secondary">{total} igreja(s)</Badge>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <Card className="bg-white/85">
          <CardHeader className="space-y-2">
            <CardTitle>Listagem</CardTitle>
            <CardDescription>
              Visualize as igrejas cadastradas e abra os detalhes em destaque.
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
              selectedChurchId={selectedChurchId}
              canEdit={canEdit}
              onView={(church) => setSelectedChurchId(church.id)}
            />
          </CardContent>
        </Card>

        <ChurchDetailsCard churchId={selectedChurchId} canEdit={canEdit} />
      </div>
    </div>
  );
}
