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

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
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
    <div className="overflow-hidden rounded-3xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/35">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Banco
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Codigo
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Admin
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
                  Nenhum banco encontrado na plataforma.
                </td>
              </tr>
            ) : null}

            {tenants.map((tenant) => {
              const inactive = isInactive(tenant.status);
              const rowLoading = togglingId === tenant.id;
              const adminLabel =
                tenant.adminName || tenant.adminUsername || tenant.adminEmail || "-";

              return (
                <tr key={tenant.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <BrandLogo
                        alt={`Logo do banco ${tenant.name}`}
                        logoUrl={tenant.logoUrl}
                        className="flex size-14 shrink-0 items-center justify-center rounded-[1.35rem] border border-border bg-card shadow-sm"
                        imageClassName="bg-card p-1.5"
                        iconClassName="size-6 text-primary"
                      />

                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {tenant.id}</p>
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
                    {adminLabel}
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
