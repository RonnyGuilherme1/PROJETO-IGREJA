"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CampaignItem } from "@/modules/campaigns/types/campaign";

interface CampaignsTableProps {
  campaigns: CampaignItem[];
  isLoading: boolean;
  canEdit: boolean;
}

function getCampaignStatusLabel(status: CampaignItem["status"]) {
  return status === "CLOSED" ? "Encerrada" : "Ativa";
}

function formatCurrency(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

export function CampaignsTable({
  campaigns,
  isLoading,
  canEdit,
}: CampaignsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/35">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Campanha
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Igreja
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Parcelas
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Valor
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Inicio
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Membros
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
            {isLoading && campaigns.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4" colSpan={8}>
                      <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                    </td>
                  </tr>
                ))
              : null}

            {!isLoading && campaigns.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-14 text-center text-sm text-muted-foreground"
                >
                  Nenhuma campanha encontrada com os filtros informados.
                </td>
              </tr>
            ) : null}

            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{campaign.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {campaign.description || "Sem descricao informada"}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {campaign.churchName}
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {campaign.installmentCount}
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {formatCurrency(campaign.installmentAmount)}
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {formatDate(campaign.startDate)}
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {campaign.membersCount}
                </td>
                <td className="px-4 py-4">
                  <Badge
                    variant={campaign.status === "CLOSED" ? "outline" : "secondary"}
                  >
                    {getCampaignStatusLabel(campaign.status)}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col justify-end gap-2 sm:flex-row">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/campanhas/${campaign.id}`}>
                        <Eye className="size-4" />
                        Detalhes
                      </Link>
                    </Button>
                    {canEdit ? (
                      <Button asChild size="sm">
                        <Link href={`/campanhas/${campaign.id}/editar`}>
                          <Pencil className="size-4" />
                          Editar
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
