"use client";

import Link from "next/link";
import { LoaderCircle, LockKeyhole, Pencil, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserStatus } from "@/modules/auth/types/auth";
import type { PlatformUserItem } from "@/modules/master/types/platform-user";

interface PlatformUsersTableProps {
  users: PlatformUserItem[];
  isLoading: boolean;
  canManageUsers: boolean;
  inactivatingId: string | null;
  onInactivate: (user: PlatformUserItem) => void;
}

function isInactive(status: UserStatus) {
  return status === "INACTIVE";
}

function getStatusLabel(status: UserStatus) {
  return isInactive(status) ? "Inativo" : "Ativo";
}

function getPlatformRoleLabel(role: PlatformUserItem["platformRole"]) {
  switch (role) {
    case "PLATFORM_OPERATOR":
      return "Operador de ambientes";
    case "PLATFORM_SUPPORT":
      return "Suporte da plataforma";
    default:
      return "Administrador da plataforma";
  }
}

function getPlatformRoleHint(role: PlatformUserItem["platformRole"]) {
  switch (role) {
    case "PLATFORM_OPERATOR":
      return "Opera ambientes sem criar outros usuarios master.";
    case "PLATFORM_SUPPORT":
      return "Perfil legado mantido com escopo seguro.";
    default:
      return "Gerencia usuarios da plataforma e ambientes.";
  }
}

export function PlatformUsersTable({
  users,
  isLoading,
  canManageUsers,
  inactivatingId,
  onInactivate,
}: PlatformUsersTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-[color:var(--surface-base)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/35">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Nome
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Username e e-mail
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Papel
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Protecao
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && users.length === 0
              ? Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                    </td>
                  </tr>
                ))
              : null}

            {!isLoading && users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-14 text-center text-sm text-muted-foreground"
                >
                  Nenhum usuario da plataforma cadastrado.
                </td>
              </tr>
            ) : null}

            {users.map((user) => {
              const inactive = isInactive(user.status);
              const rowLoading = inactivatingId === user.id;
              const canInactivate =
                canManageUsers && !inactive && !user.isSystemProtected && !rowLoading;

              return (
                <tr key={user.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Criado em{" "}
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <p>Username: {user.username || "-"}</p>
                      <p>E-mail: {user.email || "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <Badge variant="outline">{getPlatformRoleLabel(user.platformRole)}</Badge>
                      {user.platformRole === "PLATFORM_OPERATOR" ? (
                        <Badge variant="secondary">Opera ambientes</Badge>
                      ) : null}
                      <p className="text-xs leading-5 text-muted-foreground">
                        {getPlatformRoleHint(user.platformRole)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={inactive ? "outline" : "secondary"}>
                      {getStatusLabel(user.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    {user.isSystemProtected ? (
                      <Badge variant="secondary" className="gap-1.5">
                        <LockKeyhole className="size-3.5" />
                        Protegido pelo sistema
                      </Badge>
                    ) : (
                      <Badge variant="outline">Gerenciavel</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {canManageUsers ? (
                      <div className="flex flex-col justify-end gap-2 sm:flex-row">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/master/usuarios/${user.id}/editar`}>
                            <Pencil className="size-4" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => onInactivate(user)}
                          disabled={!canInactivate}
                        >
                          {rowLoading ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <UserX className="size-4" />
                          )}
                          Inativar
                        </Button>
                      </div>
                    ) : (
                      <p className="text-right text-xs text-muted-foreground">
                        Somente leitura para operadores.
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
