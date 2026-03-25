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

function getStatusMeta(status: MemberItem["status"]) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Ativo",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "VISITOR":
      return {
        label: "Visitante",
        className: "border-sky-200 bg-sky-50 text-sky-700",
      };
    case "IN_PROCESS":
      return {
        label: "Em processo",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "INACTIVE":
    default:
      return {
        label: "Inativo",
        className: "border-border bg-card text-muted-foreground",
      };
  }
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

function formatAge(value: string | null) {
  if (!value) {
    return null;
  }

  const birthDateValue = value.includes("T") ? value.slice(0, 10) : value;
  const birthDate = new Date(`${birthDateValue}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? `${age} anos` : null;
}

function getSecondaryProfileLine(member: MemberItem) {
  const details = [formatAge(member.birthDate), member.gender].filter(Boolean);

  if (details.length === 0) {
    return "Dados pessoais nao informados";
  }

  return details.join(" | ");
}

function getKeyDates(member: MemberItem) {
  return [
    { label: "Entrada", value: member.joinedAt },
    { label: "Membresia", value: member.membershipDate },
    { label: "Batismo", value: member.baptismDate },
    { label: "Conversao", value: member.conversionDate },
  ]
    .filter((item) => Boolean(item.value))
    .slice(0, 2);
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
                Igreja
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Contato
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Datas-chave
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
            {!isLoading && members.length === 0 ? (
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

            {members.map((member) => {
              const inactive = isInactive(member.status);
              const rowLoading = inactivatingId === member.id;
              const statusMeta = getStatusMeta(member.status);
              const keyDates = getKeyDates(member);

              return (
                <tr key={member.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {member.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getSecondaryProfileLine(member)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {churchNamesById[member.churchId] || member.churchId || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <p>{formatPhone(member.phone || "")}</p>
                      <p className="break-all text-xs">
                        {member.email || "E-mail nao informado"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {keyDates.length > 0 ? (
                      <div className="space-y-1">
                        {keyDates.map((item) => (
                          <p key={`${member.id}-${item.label}`}>
                            <span className="font-medium text-foreground">
                              {item.label}:
                            </span>{" "}
                            {formatDate(item.value || "")}
                          </p>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      <Badge variant="outline" className={statusMeta.className}>
                        {statusMeta.label}
                      </Badge>
                      {member.administrativeNotes ? (
                        <p className="max-w-48 text-xs text-muted-foreground">
                          {member.administrativeNotes}
                        </p>
                      ) : null}
                    </div>
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
