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
import { CampaignsFilters } from "@/modules/campaigns/components/campaigns-filters";
import { CampaignsTable } from "@/modules/campaigns/components/campaigns-table";
import { listCampaigns } from "@/modules/campaigns/services/campaigns-service";
import type {
  CampaignFilters,
  CampaignItem,
} from "@/modules/campaigns/types/campaign";
import { listChurches } from "@/modules/churches/services/churches-service";

interface CampaignsListPageProps {
  canEdit: boolean;
}

interface ChurchOption {
  id: string;
  name: string;
}

const initialFilters: CampaignFilters = {
  title: "",
  churchId: "",
  status: "",
};

export function CampaignsListPage({ canEdit }: CampaignsListPageProps) {
  const [filters, setFilters] = useState<CampaignFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<CampaignFilters>(initialFilters);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async (currentFilters: CampaignFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listCampaigns(currentFilters);
      setCampaigns(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar a listagem de campanhas.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns(appliedFilters);
  }, [appliedFilters, loadCampaigns]);

  useEffect(() => {
    let isActive = true;

    async function loadReferenceData() {
      try {
        const response = await listChurches({ name: "", status: "" });

        if (!isActive) {
          return;
        }

        setChurchOptions(
          response.items.map((church) => ({
            id: church.id,
            name: church.name,
          })),
        );
        setReferenceDataError(null);
      } catch (loadError) {
        if (isActive) {
          setReferenceDataError(
            getApiErrorMessage(
              loadError,
              "Nao foi possivel carregar a lista de igrejas para os filtros.",
            ),
          );
        }
      }
    }

    void loadReferenceData();

    return () => {
      isActive = false;
    };
  }, []);

  function handleFilterChange(field: keyof CampaignFilters, value: string) {
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

  if (error && campaigns.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel abrir as campanhas"
        description={error}
        onAction={() => void loadCampaigns(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campanhas"
        description="Cadastre campanhas parceladas, acompanhe membros vinculados e visualize a situacao das parcelas."
        badge={canEdit ? "Gerenciamento" : "Consulta"}
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/campanhas/nova">
                <Plus className="size-4" />
                Nova campanha
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
              Filtre por titulo, igreja e status para localizar campanhas com rapidez.
            </CardDescription>
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {referenceDataError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {referenceDataError}
            </div>
          ) : null}

          <CampaignsFilters
            filters={filters}
            churchOptions={churchOptions}
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
            Visualize campanhas cadastradas, confira a igreja vinculada e acesse o detalhe das parcelas por membro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <CampaignsTable
            campaigns={campaigns}
            isLoading={isLoading}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
