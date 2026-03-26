"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { PlatformUsersTable } from "@/modules/master/components/platform-users-table";
import {
  canManagePlatformUsers,
  getMasterAccessLabel,
} from "@/modules/master/lib/master-access";
import { getStoredMasterUser } from "@/modules/master/services/master-session-service";
import {
  inactivateMasterPlatformUser,
  listMasterPlatformUsers,
} from "@/modules/master/services/master-platform-users-service";
import type { PlatformUserItem } from "@/modules/master/types/platform-user";

export function PlatformUsersListPage() {
  const router = useRouter();
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<
    typeof getStoredMasterUser
  >>(null);
  const canManageUsers = canManagePlatformUsers(currentUser);
  const [users, setUsers] = useState<PlatformUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [userPendingInactivation, setUserPendingInactivation] =
    useState<PlatformUserItem | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredMasterUser());
    setIsSessionReady(true);
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listMasterPlatformUsers();
      setUsers(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar os usuarios da plataforma.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    if (!canManageUsers) {
      setIsLoading(false);
      router.replace("/master/dashboard");
      return;
    }

    void loadUsers();
  }, [canManageUsers, isSessionReady, loadUsers, router]);

  const protectedUsersCount = users.filter((user) => user.isSystemProtected).length;
  const operatorUsersCount = users.filter(
    (user) => user.platformRole === "PLATFORM_OPERATOR",
  ).length;

  if (!isSessionReady) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Usuarios da plataforma"
          description="Carregando a configuracao visual e as permissoes da area master."
          badge="Plataforma"
        />

        <Card className="bg-[color:var(--surface-soft)]">
          <CardHeader>
            <CardTitle>Visao geral</CardTitle>
            <CardDescription>
              Preparando os indicadores e a listagem de usuarios da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-3xl bg-secondary/60"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--surface-soft)]">
          <CardHeader>
            <CardTitle>Listagem</CardTitle>
            <CardDescription>Carregando usuarios master.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageUsers) {
    return null;
  }

  async function handleInactivate(user: PlatformUserItem) {
    if (!canManageUsers || user.isSystemProtected) {
      return;
    }

    setUserPendingInactivation(user);
  }

  async function confirmInactivateUser() {
    if (!userPendingInactivation || !canManageUsers) {
      return;
    }

    setInactivatingId(userPendingInactivation.id);
    setError(null);

    try {
      await inactivateMasterPlatformUser(userPendingInactivation.id);
      await loadUsers();
      setUserPendingInactivation(null);
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
        title="Nao foi possivel abrir os usuarios master"
        description={error}
        onAction={() => void loadUsers()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios da plataforma"
        description="Gerencie quem administra a plataforma e quem opera apenas os ambientes."
        badge={getMasterAccessLabel(currentUser)}
        action={
          <Button asChild>
            <Link href="/master/usuarios/novo">
              <Plus className="size-4" />
              Novo usuario master
            </Link>
          </Button>
        }
      />

      <Card className="bg-[color:var(--surface-soft)]">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Visao geral</CardTitle>
            <CardDescription>
              Usuarios protegidos ficam identificados e operadores permanecem restritos ao fluxo operacional de ambientes.
            </CardDescription>
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-[color:var(--surface-base)] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Total
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {total}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Usuarios cadastrados para operar ou administrar a plataforma.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-[color:var(--surface-base)] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Protegidos
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {protectedUsersCount}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Usuarios com protecao do sistema, sem inativacao ou rebaixamento comum.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-[color:var(--surface-base)] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Operacionais
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {operatorUsersCount}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Usuarios com atuacao apenas em ambientes, sem criar outros masters.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[color:var(--surface-soft)]">
        <CardHeader className="space-y-2">
          <CardTitle>Listagem</CardTitle>
          <CardDescription>
            Visualize equipe da plataforma, papeis operacionais e protecoes ativas com a mesma leitura administrativa do restante do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <PlatformUsersTable
            users={users}
            isLoading={isLoading}
            canManageUsers={canManageUsers}
            inactivatingId={inactivatingId}
            onInactivate={handleInactivate}
          />
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(userPendingInactivation)}
        title="Inativar usuario master"
        description={
          userPendingInactivation
            ? `O acesso de ${userPendingInactivation.name} sera bloqueado ate nova edicao manual do status.`
            : ""
        }
        confirmLabel="Inativar"
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
