"use client";

import Link from "next/link";
import { LoaderCircle, Pencil, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserItem } from "@/modules/users/types/user";

interface UsersTableProps {
  users: UserItem[];
  isLoading: boolean;
  inactivatingId: string | null;
  onInactivate: (user: UserItem) => void;
}

function normalizeStatusKey(status: string) {
  return status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function isInactive(status: string) {
  const key = normalizeStatusKey(status);
  return key === "INACTIVE" || key === "INATIVO" || key === "DISABLED";
}

function getStatusLabel(status: string) {
  return isInactive(status) ? "Inativo" : "Ativo";
}

function getRoleLabel(role: string) {
  if (!role.trim()) {
    return "-";
  }

  return role
    .replace(/^ROLE_/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function UsersTable({
  users,
  isLoading,
  inactivatingId,
  onInactivate,
}: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/35">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Nome
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                E-mail
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
            {isLoading && users.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
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
                  Nenhum usuario encontrado com os filtros informados.
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
                        ID: {user.id}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {user.email || "-"}
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
                    {user.churchId || "-"}
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
