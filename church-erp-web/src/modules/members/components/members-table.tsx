"use client";

import Link from "next/link";
import { LoaderCircle, Pencil, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MemberItem } from "@/modules/members/types/member";

interface MembersTableProps {
  members: MemberItem[];
  churchNamesById: Record<string, string>;
  isLoading: boolean;
  canEdit: boolean;
  inactivatingId: string | null;
  onInactivate: (member: MemberItem) => void;
}

function isInactive(status: MemberItem["status"]) {
  return status === "INACTIVE";
}

function getStatusLabel(status: MemberItem["status"]) {
  return isInactive(status) ? "Inativo" : "Ativo";
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  return value || "-";
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const dateValue = value.includes("T") ? value.slice(0, 10) : value;
  const parsed = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

export function MembersTable({
  members,
  churchNamesById,
  isLoading,
  canEdit,
  inactivatingId,
  onInactivate,
}: MembersTableProps) {
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
                Igreja
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Telefone
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                E-mail
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Ingresso
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && members.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4" colSpan={7}>
                      <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                    </td>
                  </tr>
                ))
              : null}

            {!isLoading && members.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-14 text-center text-sm text-muted-foreground"
                >
                  Nenhum membro encontrado para os filtros aplicados.
                </td>
              </tr>
            ) : null}

            {members.map((member) => {
              const inactive = isInactive(member.status);
              const rowLoading = inactivatingId === member.id;

              return (
                <tr key={member.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {member.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.gender || "Genero nao informado"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {churchNamesById[member.churchId] || member.churchId || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatPhone(member.phone || "")}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {member.email || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(member.joinedAt || "")}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={inactive ? "outline" : "secondary"}>
                      {getStatusLabel(member.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                      {canEdit ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/membros/${member.id}/editar`}>
                              <Pencil className="size-4" />
                              Editar
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onInactivate(member)}
                            disabled={inactive || rowLoading}
                          >
                            {rowLoading ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <UserX className="size-4" />
                            )}
                            Inativar
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Somente consulta
                        </span>
                      )}
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
