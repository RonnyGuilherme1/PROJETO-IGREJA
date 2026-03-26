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

const feedbackMessages = {
  created: "Usuario cadastrado com sucesso.",
  updated: "Usuario atualizado com sucesso.",
  inactivated: "Usuario inativado com sucesso.",
} as const;

export function UsersListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>(initialFilters);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [churchNamesById, setChurchNamesById] = useState<Record<string, string>>(
    {},
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [churchesError, setChurchesError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [userPendingInactivation, setUserPendingInactivation] =
    useState<UserItem | null>(null);

  const loadUsers = useCallback(async (currentFilters: UserFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listUsers(currentFilters);
      setUsers(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(loadError, "Nao foi possivel carregar os usuarios."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers(appliedFilters);
  }, [appliedFilters, loadUsers]);

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

    async function loadChurchNames() {
      try {
        const response = await listChurches({ name: "", status: "" });

        if (!isActive) {
          return;
        }

        setChurchesError(null);
        setChurchNamesById(
          Object.fromEntries(
            response.items.map((church) => [church.id, church.name]),
          ),
        );
      } catch (loadError) {
        if (isActive) {
          setChurchesError(
            getApiErrorMessage(
              loadError,
              "Nao foi possivel carregar os nomes das igrejas.",
            ),
          );
        }
      }
    }

    void loadChurchNames();

    return () => {
      isActive = false;
    };
  }, []);

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
    setUserPendingInactivation(user);
  }

  async function confirmInactivateUser() {
    if (!userPendingInactivation) {
      return;
    }

    setInactivatingId(userPendingInactivation.id);
    setError(null);
    setFeedback(null);

    try {
      await inactivateUser(userPendingInactivation.id);
      await loadUsers(appliedFilters);
      setUserPendingInactivation(null);
      setFeedback(feedbackMessages.inactivated);
    } catch (actionError) {
      setError(
        getApiErrorMessage(actionError, "Nao foi possivel inativar o usuario."),
      );
    } finally {
      setInactivatingId(null);
    }
  }

  if (error && users.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel carregar os usuarios"
        description={error}
        onAction={() => void loadUsers(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Usuarios
          </h1>
          <Badge variant="secondary">Administrador</Badge>
        </div>
        <Button asChild>
          <Link href="/usuarios/novo">
            <Plus className="size-4" />
            Novo usuario
          </Link>
        </Button>
      </div>

      <Card className="bg-white/85">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
          <CardTitle>Filtros</CardTitle>
          <Badge variant="secondary">Total: {total}</Badge>
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
        <CardHeader className="pb-4">
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {feedback}
            </div>
          ) : null}

          {churchesError ? (
            <ErrorView
              variant="inline"
              title="Igrejas indisponiveis"
              description={churchesError}
            />
          ) : null}

          {error ? (
            <ErrorView
              variant="inline"
              title="Nao foi possivel atualizar a listagem"
              description={error}
              actionLabel="Recarregar listagem"
              onAction={() => void loadUsers(appliedFilters)}
            />
          ) : null}

          {isLoading && users.length === 0 ? (
            <PageLoading variant="list" />
          ) : (
            <UsersTable
              users={users}
              churchNamesById={churchNamesById}
              isLoading={isLoading}
              inactivatingId={inactivatingId}
              onInactivate={handleInactivate}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(userPendingInactivation)}
        title="Inativar usuario"
        description={
          userPendingInactivation
            ? `${userPendingInactivation.name} sera inativado e perdera o acesso ao sistema. O cadastro continuara disponivel para consulta.`
            : ""
        }
        confirmLabel="Inativar"
        cancelLabel="Voltar"
        confirmVariant="destructive"
        isLoading={Boolean(
          userPendingInactivation &&
            inactivatingId === userPendingInactivation.id,
        )}
        onConfirm={() => void confirmInactivateUser()}
        onOpenChange={(open) => {
          if (!open) {
            setUserPendingInactivation(null);
          }
        }}
      />
    </div>
  );
}
