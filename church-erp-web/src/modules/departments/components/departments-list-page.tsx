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
import { DepartmentsFilters } from "@/modules/departments/components/departments-filters";
import { DepartmentsTable } from "@/modules/departments/components/departments-table";
import {
  inactivateDepartment,
  listDepartments,
} from "@/modules/departments/services/departments-service";
import type {
  DepartmentFilters,
  DepartmentItem,
} from "@/modules/departments/types/department";

interface DepartmentsListPageProps {
  canEdit: boolean;
}

const initialFilters: DepartmentFilters = {
  name: "",
  active: "",
};

export function DepartmentsListPage({ canEdit }: DepartmentsListPageProps) {
  const [filters, setFilters] = useState<DepartmentFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<DepartmentFilters>(initialFilters);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [departmentPendingInactivation, setDepartmentPendingInactivation] =
    useState<DepartmentItem | null>(null);

  const loadDepartments = useCallback(async (currentFilters: DepartmentFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listDepartments(currentFilters);
      setDepartments(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar a listagem de departamentos.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDepartments(appliedFilters);
  }, [appliedFilters, loadDepartments]);

  function handleFilterChange(field: keyof DepartmentFilters, value: string) {
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

  function handleInactivate(department: DepartmentItem) {
    setDepartmentPendingInactivation(department);
  }

  async function confirmInactivateDepartment() {
    if (!departmentPendingInactivation) {
      return;
    }

    setInactivatingId(departmentPendingInactivation.id);
    setError(null);

    try {
      await inactivateDepartment(departmentPendingInactivation.id);
      await loadDepartments(appliedFilters);
      setDepartmentPendingInactivation(null);
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          "Nao foi possivel inativar o departamento selecionado.",
        ),
      );
    } finally {
      setInactivatingId(null);
    }
  }

  if (error && departments.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel abrir os departamentos"
        description={error}
        onAction={() => void loadDepartments(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departamentos"
        description="Cadastre e acompanhe os departamentos usados na organizacao da igreja."
        badge={canEdit ? "Gerenciamento" : "Consulta"}
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/departamentos/novo">
                <Plus className="size-4" />
                Novo departamento
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
              Filtre por nome e status para localizar departamentos com rapidez.
            </CardDescription>
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent>
          <DepartmentsFilters
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
            Visualize departamentos cadastrados, ajuste descricoes e controle o
            status de uso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <DepartmentsTable
            departments={departments}
            isLoading={isLoading}
            canEdit={canEdit}
            inactivatingId={inactivatingId}
            onInactivate={handleInactivate}
          />
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(departmentPendingInactivation)}
        title="Inativar departamento"
        description={
          departmentPendingInactivation
            ? `O departamento ${departmentPendingInactivation.name} deixara de ficar disponivel para uso ativo.`
            : ""
        }
        confirmLabel="Inativar"
        confirmVariant="destructive"
        isLoading={Boolean(
          departmentPendingInactivation &&
            inactivatingId === departmentPendingInactivation.id,
        )}
        onConfirm={() => void confirmInactivateDepartment()}
        onOpenChange={(open) => {
          if (!open) {
            setDepartmentPendingInactivation(null);
          }
        }}
      />
    </div>
  );
}
