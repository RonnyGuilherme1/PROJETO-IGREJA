"use client";

import Link from "next/link";
import { LoaderCircle, Pencil, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DepartmentItem } from "@/modules/departments/types/department";

interface DepartmentsTableProps {
  departments: DepartmentItem[];
  isLoading: boolean;
  canEdit: boolean;
  inactivatingId: string | null;
  onInactivate: (department: DepartmentItem) => void;
}

function getStatusLabel(active: boolean) {
  return active ? "Ativo" : "Inativo";
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

export function DepartmentsTable({
  departments,
  isLoading,
  canEdit,
  inactivatingId,
  onInactivate,
}: DepartmentsTableProps) {
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
                Descricao
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Atualizado em
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && departments.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4" colSpan={5}>
                      <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                    </td>
                  </tr>
                ))
              : null}

            {!isLoading && departments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-14 text-center text-sm text-muted-foreground"
                >
                  Nenhum departamento encontrado com os filtros informados.
                </td>
              </tr>
            ) : null}

            {departments.map((department) => {
              const rowLoading = inactivatingId === department.id;

              return (
                <tr key={department.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {department.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {department.description || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={department.active ? "secondary" : "outline"}>
                      {getStatusLabel(department.active)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(department.updatedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                      {canEdit ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/departamentos/${department.id}/editar`}>
                              <Pencil className="size-4" />
                              Editar
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onInactivate(department)}
                            disabled={!department.active || rowLoading}
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
