"use client";

import Link from "next/link";
import { CircleOff, Eye, LoaderCircle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChurchItem } from "@/modules/churches/types/church";

interface ChurchesTableProps {
  churches: ChurchItem[];
  isLoading: boolean;
  selectedChurchId: string | null;
  canEdit: boolean;
  inactivatingId: string | null;
  onView: (church: ChurchItem) => void;
  onInactivate: (church: ChurchItem) => void;
}

function isInactive(status: ChurchItem["status"]) {
  return status === "INACTIVE";
}

function getStatusLabel(status: ChurchItem["status"]) {
  return isInactive(status) ? "Inativa" : "Ativa";
}

function formatCnpj(value: string | null) {
  if (!value) {
    return "-";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length !== 14) {
    return value || "-";
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function formatPhone(value: string | null) {
  if (!value) {
    return "-";
  }

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
  inactivatingId,
  onView,
  onInactivate,
}: ChurchesTableProps) {
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
            {!isLoading && churches.length === 0 ? (
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

            {churches.map((church) => {
              const inactive = isInactive(church.status);
              const isSelected = selectedChurchId === church.id;
              const rowLoading = inactivatingId === church.id;

              return (
                <tr
                  key={church.id}
                  className={isSelected ? "bg-secondary/15 align-top" : "align-top"}
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
                        variant={isSelected ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => onView(church)}
                      >
                        <Eye className="size-4" />
                        {isSelected ? "Visualizando" : "Visualizar"}
                      </Button>
                      {canEdit ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/igrejas/${church.id}/editar`}>
                              <Pencil className="size-4" />
                              Editar
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onInactivate(church)}
                            disabled={inactive || rowLoading}
                          >
                            {rowLoading ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <CircleOff className="size-4" />
                            )}
                            Inativar
                          </Button>
                        </>
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
