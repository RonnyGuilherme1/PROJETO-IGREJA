"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Pencil, Phone, UserRound } from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getChurchById } from "@/modules/churches/services/churches-service";
import type { ChurchItem } from "@/modules/churches/types/church";

interface ChurchDetailsCardProps {
  churchId: string | null;
  canEdit: boolean;
}

function isInactive(status: string) {
  return status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .includes("INACTIVE");
}

export function ChurchDetailsCard({
  churchId,
  canEdit,
}: ChurchDetailsCardProps) {
  const [church, setChurch] = useState<ChurchItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!churchId) {
      setChurch(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const currentChurchId = churchId;
    let isActive = true;

    async function loadChurch() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getChurchById(currentChurchId);

        if (isActive) {
          setChurch(response);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            getApiErrorMessage(
              loadError,
              "Nao foi possivel carregar os detalhes da igreja.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadChurch();

    return () => {
      isActive = false;
    };
  }, [churchId]);

  if (!churchId) {
    return (
      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Visualizacao</CardTitle>
          <CardDescription>
            Selecione uma igreja na tabela para visualizar os detalhes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Falha ao carregar detalhes</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !church) {
    return (
      <Card className="bg-white/85">
        <CardHeader className="space-y-4">
          <div className="h-6 w-28 animate-pulse rounded-full bg-secondary/70" />
          <div className="h-9 w-52 animate-pulse rounded-2xl bg-secondary/70" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-2xl bg-secondary/60"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/85">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge variant={isInactive(church.status) ? "outline" : "secondary"}>
              {isInactive(church.status) ? "Inativa" : "Ativa"}
            </Badge>
            <div>
              <CardTitle>{church.name}</CardTitle>
              <CardDescription>{church.email || "Sem e-mail cadastrado"}</CardDescription>
            </div>
          </div>
          {canEdit ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/igrejas/${church.id}/editar`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl bg-secondary/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Pastor responsavel
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <UserRound className="size-4 text-primary" />
            {church.pastorName || "Nao informado"}
          </div>
        </div>

        <div className="rounded-2xl bg-secondary/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Contato
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <Phone className="size-4 text-primary" />
            {church.phone || "Nao informado"}
          </div>
        </div>

        <div className="rounded-2xl bg-secondary/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Endereco
          </p>
          <div className="mt-2 flex items-start gap-2 text-sm leading-6 text-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{church.address || "Nao informado"}</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              CNPJ
            </p>
            <p className="mt-2 text-sm text-foreground">{church.cnpj || "-"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Observacoes
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {church.notes || "Sem observacoes."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
