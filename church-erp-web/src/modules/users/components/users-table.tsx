"use client";

import Link from "next/link";
import { LoaderCircle, Pencil, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserRole, UserStatus } from "@/modules/auth/types/auth";
import type { UserItem } from "@/modules/users/types/user";

interface UsersTableProps {
  users: UserItem[];
  churchNamesById: Record<string, string>;
  isLoading: boolean;
  inactivatingId: string | null;
  onInactivate: (user: UserItem) => void;
}

function isInactive(status: UserStatus) {
  return status === "INACTIVE";
}

function getStatusLabel(status: UserStatus) {
  return isInactive(status) ? "Inativo" : "Ativo";
}

function getRoleLabel(role: UserRole) {
  switch (role) {
    case "SECRETARIA":
      return "Secretaria";
    case "TESOUREIRO":
      return "Tesoureiro";
    case "CONSULTA":
      return "Consulta";
    default:
      return "Administrador";
  }
}

export function UsersTable({
  users,
  churchNamesById,
  isLoading,
  inactivatingId,
  onInactivate,
}: UsersTableProps) {
  return (
    <div
      aria-busy={isLoading}
      className="overflow-hidden rounded-[28px] border border-border bg-white"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/30">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Nome
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Contato
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Perfil
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Igreja
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!isLoading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16">
                  <div className="space-y-1 text-center">
                    <p className="font-medium text-foreground">
                      Nenhum registro encontrado
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ajuste os filtros para tentar novamente.
                    </p>
                  </div>
                </td>
              </tr>
            ) : null}

            {users.map((user) => {
              const inactive = isInactive(user.status);
              const rowLoading = inactivatingId === user.id;

              return (
                <tr key={user.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Acesso: {user.username || "-"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <p>{user.email || "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {getRoleLabel(user.role)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={inactive ? "outline" : "secondary"}>
                      {getStatusLabel(user.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {user.churchId
                      ? churchNamesById[user.churchId] || user.churchId
                      : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/usuarios/${user.id}/editar`}>
                          <Pencil className="size-4" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onInactivate(user)}
                        disabled={inactive || rowLoading}
                      >
                        {rowLoading ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <UserX className="size-4" />
                        )}
                        Inativar
                      </Button>
                    </div>
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
