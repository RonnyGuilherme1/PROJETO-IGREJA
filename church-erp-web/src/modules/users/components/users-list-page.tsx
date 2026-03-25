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
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar os usuarios agora.",
        ),
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
              "Nao foi possivel carregar as igrejas vinculadas.",
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
        getApiErrorMessage(
          actionError,
          "Nao foi possivel concluir a inativacao agora.",
        ),
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
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gerencie acessos, perfis e vinculacoes com clareza."
        badge="Administrador"
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
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent>
          {churchesError ? (
            <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {churchesError}
            </div>
          ) : null}

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
            Visualize usuarios cadastrados, ajuste perfis e acompanhe o status dos acessos.
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

          <UsersTable
            users={users}
            churchNamesById={churchNamesById}
            isLoading={isLoading}
            inactivatingId={inactivatingId}
            onInactivate={handleInactivate}
          />
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(userPendingInactivation)}
        title="Inativar usuario"
        description={
          userPendingInactivation
            ? `${userPendingInactivation.name} deixara de acessar o sistema e o cadastro permanecera disponivel para consulta.`
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
