"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import {
  createQueryKey,
  fetchCachedQuery,
  getCachedQuerySnapshot,
  invalidateQueryPrefix,
} from "@/lib/query/query-cache";
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
import { invalidateDashboardOverviewData } from "@/modules/dashboard/services/dashboard-service";
import { listChurches } from "@/modules/churches/services/churches-service";
import { UsersFilters } from "@/modules/users/components/users-filters";
import { UsersTable } from "@/modules/users/components/users-table";
import { inactivateUser, listUsers } from "@/modules/users/services/users-service";
import type { ChurchFilters, ChurchListResult } from "@/modules/churches/types/church";
import type { UserFilters, UserItem } from "@/modules/users/types/user";
import type { UserListResult } from "@/modules/users/types/user";

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

const USERS_LIST_QUERY_PREFIX = "users:list";
const CHURCHES_LIST_QUERY_PREFIX = "churches:list";
const USERS_LIST_TTL_MS = 30_000;
const CHURCH_NAMES_TTL_MS = 5 * 60_000;
const churchLookupFilters: ChurchFilters = {
  name: "",
  status: "",
};

function getUsersListQueryKey(filters: UserFilters) {
  return createQueryKey(USERS_LIST_QUERY_PREFIX, {
    name: filters.name.trim(),
    email: filters.email.trim(),
    status: filters.status,
    role: filters.role,
  });
}

function getChurchLookupQueryKey() {
  return createQueryKey(CHURCHES_LIST_QUERY_PREFIX, churchLookupFilters);
}

function buildChurchNamesById(churches?: ChurchListResult) {
  return Object.fromEntries(
    (churches?.items ?? []).map((church) => [church.id, church.name]),
  );
}

export function UsersListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feedbackKey = searchParams.get("feedback");
  const hasNavigationFeedback = Boolean(
    feedbackKey &&
      Object.prototype.hasOwnProperty.call(feedbackMessages, feedbackKey),
  );
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>(initialFilters);
  const [users, setUsers] = useState<UserItem[]>(
    () =>
      getCachedQuerySnapshot<UserListResult>(getUsersListQueryKey(initialFilters))
        .data?.items ?? [],
  );
  const [churchNamesById, setChurchNamesById] = useState<Record<string, string>>(
    () =>
      buildChurchNamesById(
        getCachedQuerySnapshot<ChurchListResult>(getChurchLookupQueryKey()).data,
      ),
  );
  const [total, setTotal] = useState(
    () =>
      getCachedQuerySnapshot<UserListResult>(getUsersListQueryKey(initialFilters))
        .data?.total ?? 0,
  );
  const [isLoading, setIsLoading] = useState(
    () =>
      !getCachedQuerySnapshot<UserListResult>(
        getUsersListQueryKey(initialFilters),
      ).data,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [churchesError, setChurchesError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [userPendingInactivation, setUserPendingInactivation] =
    useState<UserItem | null>(null);

  const loadUsers = useCallback(
    async (currentFilters: UserFilters, options?: { force?: boolean }) => {
      if (options?.force) {
        invalidateQueryPrefix(USERS_LIST_QUERY_PREFIX);
        invalidateDashboardOverviewData();
      }

      const queryKey = getUsersListQueryKey(currentFilters);
      const snapshot = getCachedQuerySnapshot<UserListResult>(queryKey);

      if (snapshot.data) {
        setUsers(snapshot.data.items);
        setTotal(snapshot.data.total);
      }

      if (snapshot.isFresh && !options?.force) {
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchCachedQuery(queryKey, () => listUsers(currentFilters), {
          ttlMs: USERS_LIST_TTL_MS,
          force: options?.force,
        });

        setUsers(response.items);
        setTotal(response.total);
      } catch (loadError) {
        setError(
          getApiErrorMessage(loadError, "Nao foi possivel carregar os usuarios."),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const loadChurchNames = useCallback(async () => {
    const queryKey = getChurchLookupQueryKey();
    const snapshot = getCachedQuerySnapshot<ChurchListResult>(queryKey);

    if (snapshot.data) {
      setChurchNamesById(buildChurchNamesById(snapshot.data));
      setChurchesError(null);
    }

    if (snapshot.isFresh) {
      return;
    }

    setChurchesError(null);

    try {
      const response = await fetchCachedQuery(queryKey, () => listChurches(churchLookupFilters), {
        ttlMs: CHURCH_NAMES_TTL_MS,
      });

      setChurchesError(null);
      setChurchNamesById(buildChurchNamesById(response));
    } catch (loadError) {
      setChurchesError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar os nomes das igrejas.",
        ),
      );
    }
  }, []);

  useEffect(() => {
    void loadUsers(appliedFilters, { force: hasNavigationFeedback });
  }, [appliedFilters, hasNavigationFeedback, loadUsers]);

  useEffect(() => {
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
  }, [feedbackKey, pathname, router, searchParams]);

  useEffect(() => {
    void loadChurchNames();
  }, [loadChurchNames]);

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
      await loadUsers(appliedFilters, { force: true });
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
        onAction={() => void loadUsers(appliedFilters, { force: true })}
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
              onAction={() => void loadUsers(appliedFilters, { force: true })}
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
