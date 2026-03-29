"use client";

import { Pencil, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChurchItem } from "@/modules/churches/types/church";
import type { WhatsappDestinationItem } from "@/modules/notice-delivery/types/whatsapp";

interface WhatsappDestinationsTableProps {
  churches: ChurchItem[];
  destinations: WhatsappDestinationItem[];
  isMutating: boolean;
  mutatingDestinationId: string | null;
  onEdit: (destination: WhatsappDestinationItem) => void;
  onInactivate: (destination: WhatsappDestinationItem) => void;
}

function resolveChurchLabel(
  churches: ChurchItem[],
  churchId: string | null,
): string {
  if (!churchId) {
    return "Todas as igrejas";
  }

  return churches.find((church) => church.id === churchId)?.name ?? "Igreja";
}

function getDestinationTypeLabel(type: WhatsappDestinationItem["type"]) {
  return type === "GROUP" ? "Grupo" : "Contato individual";
}

function getDestinationTargetLabel(destination: WhatsappDestinationItem) {
  return destination.type === "GROUP"
    ? destination.groupId ?? "-"
    : destination.phoneNumber ?? "-";
}

export function WhatsappDestinationsTable({
  churches,
  destinations,
  isMutating,
  mutatingDestinationId,
  onEdit,
  onInactivate,
}: WhatsappDestinationsTableProps) {
  if (destinations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
        Nenhum grupo ou contato cadastrado ainda. Adicione um item quando
        precisar enviar avisos por aqui.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border">
      <div className="hidden grid-cols-[1.1fr_0.9fr_1fr_0.9fr_auto] gap-4 border-b border-border bg-secondary/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
        <span>Grupo ou contato</span>
        <span>Tipo</span>
        <span>Grupo ou numero</span>
        <span>Igreja</span>
        <span>Acoes</span>
      </div>

      <div className="divide-y divide-border bg-card">
        {destinations.map((destination) => {
          const isCurrentMutation =
            isMutating && mutatingDestinationId === destination.id;

          return (
            <div
              key={destination.id}
              className="grid gap-4 px-5 py-4 md:grid-cols-[1.1fr_0.9fr_1fr_0.9fr_auto] md:items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{destination.label}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      destination.enabled
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {destination.enabled ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground md:hidden">
                  {getDestinationTypeLabel(destination.type)} •{" "}
                  {resolveChurchLabel(churches, destination.churchId)}
                </p>
              </div>

              <div className="text-sm text-foreground">
                {getDestinationTypeLabel(destination.type)}
              </div>

              <div className="text-sm text-foreground">
                {getDestinationTargetLabel(destination)}
              </div>

              <div className="text-sm text-muted-foreground">
                {resolveChurchLabel(churches, destination.churchId)}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(destination)}
                  disabled={isCurrentMutation}
                >
                  <Pencil className="size-4" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onInactivate(destination)}
                  disabled={!destination.enabled || isCurrentMutation}
                >
                  <PowerOff className="size-4" />
                  Inativar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
