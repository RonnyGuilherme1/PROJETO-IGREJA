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
import { listChurches } from "@/modules/churches/services/churches-service";
import { MembersFilters } from "@/modules/members/components/members-filters";
import { MembersTable } from "@/modules/members/components/members-table";
import { getMembersAccessLabel } from "@/modules/members/lib/members-permissions";
import { inactivateMember, listMembers } from "@/modules/members/services/members-service";
import type { MemberFilters, MemberItem } from "@/modules/members/types/member";

interface MembersListPageProps {
  canEdit: boolean;
  currentProfile?: string;
}

interface ChurchOption {
  id: string;
  name: string;
}

const initialFilters: MemberFilters = {
  name: "",
  status: "",
  churchId: "",
};

export function MembersListPage({
  canEdit,
  currentProfile,
}: MembersListPageProps) {
  const [filters, setFilters] = useState<MemberFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<MemberFilters>(initialFilters);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [churchesError, setChurchesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);

  const loadMembers = useCallback(async (currentFilters: MemberFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listMembers(currentFilters);
      setMembers(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar a listagem de membros.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers(appliedFilters);
  }, [appliedFilters, loadMembers]);

  useEffect(() => {
    let isActive = true;

    async function loadChurchOptions() {
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
      } catch (loadError) {
        if (isActive) {
          setChurchesError(
            getApiErrorMessage(
              loadError,
              "Nao foi possivel carregar a lista de igrejas para filtro.",
            ),
          );
        }
      }
    }

    void loadChurchOptions();

    return () => {
      isActive = false;
    };
  }, []);

  function handleFilterChange(field: keyof MemberFilters, value: string) {
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

  async function handleInactivate(member: MemberItem) {
    const confirmed = window.confirm(
      `Deseja inativar o membro ${member.fullName}?`,
    );

    if (!confirmed) {
      return;
    }

    setInactivatingId(member.id);
    setError(null);

    try {
      await inactivateMember(member.id);
      await loadMembers(appliedFilters);
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          "Nao foi possivel inativar o membro selecionado.",
        ),
      );
    } finally {
      setInactivatingId(null);
    }
  }

  if (error && members.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Falha ao carregar membros"
        description={error}
        onAction={() => void loadMembers(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membros"
        description="Gerencie o cadastro de membros com filtros, listagem organizada e integracao com a API."
        badge={getMembersAccessLabel(currentProfile)}
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/membros/novo">
                <Plus className="size-4" />
                Novo membro
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
              Filtre por nome, status e igreja para localizar membros.
            </CardDescription>
          </div>
          <Badge variant="secondary">{total} membro(s)</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {churchesError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {churchesError}
            </div>
          ) : null}

          <MembersFilters
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
            Visualize membros cadastrados, acompanhe a igreja vinculada e gerencie o status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <MembersTable
            members={members}
            isLoading={isLoading}
            canEdit={canEdit}
            inactivatingId={inactivatingId}
            onInactivate={handleInactivate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
