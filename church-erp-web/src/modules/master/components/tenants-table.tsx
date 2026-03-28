"use client";

import Link from "next/link";
import { LoaderCircle, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTenantThemeLabel } from "@/lib/tenant-branding";
import type { MasterTenantItem } from "@/modules/master/types/tenant";

interface TenantsTableProps {
  tenants: MasterTenantItem[];
  isLoading: boolean;
  togglingId: string | null;
  onToggleStatus: (tenant: MasterTenantItem) => void;
}

function isInactive(status: MasterTenantItem["status"]) {
  return status === "INACTIVE";
}

function getStatusLabel(status: MasterTenantItem["status"]) {
  return isInactive(status) ? "Inativo" : "Ativo";
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

export function TenantsTable({
  tenants,
  isLoading,
  togglingId,
  onToggleStatus,
}: TenantsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-[color:var(--surface-base)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/35">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Ambiente
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Codigo
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Tema
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Criado em
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && tenants.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                    </td>
                  </tr>
                ))
              : null}

            {!isLoading && tenants.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-14 text-center text-sm text-muted-foreground"
                >
                  Nenhum ambiente encontrado na plataforma.
                </td>
              </tr>
            ) : null}

            {tenants.map((tenant) => {
              const inactive = isInactive(tenant.status);
              const rowLoading = togglingId === tenant.id;
              return (
                <tr key={tenant.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <BrandLogo
                        alt={`Logo do ambiente ${tenant.name}`}
                        logoUrl={tenant.logoUrl}
                        className="h-14 w-24 shrink-0"
                        iconClassName="size-6 text-primary"
                      />

                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{tenant.name}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Badge variant="secondary">
                            {getTenantThemeLabel(tenant.themeKey)}
                          </Badge>
                          <Badge variant="outline" className="bg-card">
                            {tenant.logoUrl ? "Logo propria" : "Logo padrao"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {tenant.code || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {getTenantThemeLabel(tenant.themeKey)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={inactive ? "outline" : "secondary"}>
                      {getStatusLabel(tenant.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(tenant.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/master/tenants/${tenant.id}/editar`}>
                          <Pencil className="size-4" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant={inactive ? "secondary" : "destructive"}
                        size="sm"
                        onClick={() => onToggleStatus(tenant)}
                        disabled={rowLoading}
                      >
                        {rowLoading ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : inactive ? (
                          <ToggleRight className="size-4" />
                        ) : (
                          <ToggleLeft className="size-4" />
                        )}
                        {inactive ? "Ativar" : "Inativar"}
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
