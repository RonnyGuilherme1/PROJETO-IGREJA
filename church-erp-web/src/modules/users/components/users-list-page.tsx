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
import { UsersFilters } from "@/modules/users/components/users-filters";
import { UsersTable } from "@/modules/users/components/users-table";
import { inactivateUser, listUsers } from "@/modules/users/services/users-service";
import type { UserFilters, UserItem } from "@/modules/users/types/user";

const initialFilters: UserFilters = {
  name: "",
  email: "",
  status: "",
  role: "",
};

export function UsersListPage() {
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>(initialFilters);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async (currentFilters: UserFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listUsers(currentFilters);
      setUsers(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar a listagem de usuarios.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers(appliedFilters);
  }, [appliedFilters, loadUsers]);

  function handleFilterChange(field: keyof UserFilters, value: string) {
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

  async function handleInactivate(user: UserItem) {
    const confirmed = window.confirm(
      `Deseja inativar o usuario ${user.name}?`,
    );

    if (!confirmed) {
      return;
    }

    setInactivatingId(user.id);
    setError(null);

    try {
      await inactivateUser(user.id);
      await loadUsers(appliedFilters);
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          "Nao foi possivel inativar o usuario selecionado.",
        ),
      );
    } finally {
      setInactivatingId(null);
    }
  }

  if (error && users.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Falha ao carregar usuarios"
        description={error}
        onAction={() => void loadUsers(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Controle administrativo de usuarios com filtros simples, listagem organizada e acoes de manutencao."
        badge="Acesso ADMIN"
        action={
          <Button asChild>
            <Link href="/usuarios/novo">
              <Plus className="size-4" />
              Novo usuario
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre por nome, e-mail, status e perfil para localizar usuarios.
            </CardDescription>
          </div>
          <Badge variant="secondary">{total} usuario(s)</Badge>
        </CardHeader>
        <CardContent>
          <UsersFilters
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
            Visualize usuarios cadastrados, edite registros e inative acessos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <UsersTable
            users={users}
            isLoading={isLoading}
            inactivatingId={inactivatingId}
            onInactivate={handleInactivate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
