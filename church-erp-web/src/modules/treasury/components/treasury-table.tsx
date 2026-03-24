"use client";

import Link from "next/link";
import { LoaderCircle, Pencil, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TreasuryMovementItem } from "@/modules/treasury/types/treasury";

interface TreasuryTableProps {
  items: TreasuryMovementItem[];
  categoriesById: Record<string, string>;
  churchesById: Record<string, string>;
  isLoading: boolean;
  canEdit: boolean;
  cancellingId: string | null;
  onCancel: (item: TreasuryMovementItem) => void;
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
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

function isExpense(type: string) {
  return type.toUpperCase() === "EXPENSE";
}

function getTypeLabel(type: string) {
  return isExpense(type) ? "Saida" : "Entrada";
}

export function TreasuryTable({
  items,
  categoriesById,
  churchesById,
  isLoading,
  canEdit,
  cancellingId,
  onCancel,
}: TreasuryTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/35">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Data
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Descricao
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Categoria
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Igreja
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Valor
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
            {isLoading && items.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4" colSpan={8}>
                      <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                    </td>
                  </tr>
                ))
              : null}

            {!isLoading && items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-14 text-center text-sm text-muted-foreground"
                >
                  Nenhuma movimentacao encontrada com os filtros informados.
                </td>
              </tr>
            ) : null}

            {items.map((item) => {
              const expense = isExpense(item.type);
              const isCancelled = item.status === "CANCELLED";
              const rowLoading = cancellingId === item.id;

              return (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(item.transactionDate)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {item.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={expense ? "outline" : "secondary"}>
                      {getTypeLabel(item.type)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {categoriesById[item.categoryId] || item.categoryId || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {churchesById[item.churchId] || item.churchId || "-"}
                  </td>
                  <td
                    className={`px-4 py-4 text-sm font-medium ${expense ? "text-rose-600" : "text-emerald-700"}`}
                  >
                    {expense ? "-" : "+"}
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {item.status === "CANCELLED" ? "Cancelada" : "Ativa"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                      {canEdit ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/tesouraria/${item.id}/editar`}>
                              <Pencil className="size-4" />
                              Editar
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onCancel(item)}
                            disabled={isCancelled || rowLoading}
                          >
                            {rowLoading ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <XCircle className="size-4" />
                            )}
                            Cancelar
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
