"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const currentUser = useMemo(() => getStoredMasterUser(), []);
  const canManageUsers = canManagePlatformUsers(currentUser);
  const [users, setUsers] = useState<PlatformUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [userPendingInactivation, setUserPendingInactivation] =
    useState<PlatformUserItem | null>(null);

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
    if (!canManageUsers) {
      setIsLoading(false);
      router.replace("/master/dashboard");
      return;
    }

    void loadUsers();
  }, [canManageUsers, loadUsers, router]);

  const protectedUsersCount = users.filter((user) => user.isSystemProtected).length;
  const operatorUsersCount = users.filter(
    (user) => user.platformRole === "PLATFORM_OPERATOR",
  ).length;

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
              Usuarios protegidos ficam identificados e operadores aparecem com escopo restrito a ambientes.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="secondary">Total: {total}</Badge>
            <Badge variant="outline">{protectedUsersCount} protegidos</Badge>
            <Badge variant="outline">{operatorUsersCount} operacionais</Badge>
          </div>
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
