"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChurchItem } from "@/modules/churches/types/church";

interface ChurchesTableProps {
  churches: ChurchItem[];
  isLoading: boolean;
  selectedChurchId: string | null;
  canEdit: boolean;
  onView: (church: ChurchItem) => void;
}

function isInactive(status: string) {
  return status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_")
    .includes("INACTIVE");
}

function getStatusLabel(status: string) {
  return isInactive(status) ? "Inativa" : "Ativa";
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 14) {
    return value || "-";
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
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

export function ChurchesTable({
  churches,
  isLoading,
  selectedChurchId,
  canEdit,
  onView,
}: ChurchesTableProps) {
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
                Pastor
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                CNPJ
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Telefone
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
            {isLoading && churches.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                    </td>
                  </tr>
                ))
              : null}

            {!isLoading && churches.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-14 text-center text-sm text-muted-foreground"
                >
                  Nenhuma igreja encontrada com os filtros informados.
                </td>
              </tr>
            ) : null}

            {churches.map((church) => {
              const inactive = isInactive(church.status);
              const isSelected = selectedChurchId === church.id;

              return (
                <tr
                  key={church.id}
                  className={isSelected ? "bg-secondary/15" : undefined}
                >
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{church.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {church.email || "Sem e-mail"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {church.pastorName || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatCnpj(church.cnpj)}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatPhone(church.phone)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={inactive ? "outline" : "secondary"}>
                      {getStatusLabel(church.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onView(church)}
                      >
                        <Eye className="size-4" />
                        Visualizar
                      </Button>
                      {canEdit ? (
                        <Button asChild size="sm">
                          <Link href={`/igrejas/${church.id}/editar`}>
                            <Pencil className="size-4" />
                            Editar
                          </Link>
                        </Button>
                      ) : null}
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
