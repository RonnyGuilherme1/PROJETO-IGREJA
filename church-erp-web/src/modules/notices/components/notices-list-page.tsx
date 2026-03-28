"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
import { ErrorView } from "@/components/shared/error-view";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listNotices } from "@/modules/notices/services/notices-service";
import type { NoticeItem } from "@/modules/notices/types/notices";

interface NoticesListPageProps {
  canEdit: boolean;
}

function formatDateTime(value: string | null) {
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

function getStatusLabel(status: NoticeItem["status"]) {
  switch (status) {
    case "READY":
      return "Pronto";
    case "SENT":
      return "Enviado";
    default:
      return "Rascunho";
  }
}

export function NoticesListPage({ canEdit }: NoticesListPageProps) {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listNotices();
      setNotices(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar a listagem de avisos.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  if (error && notices.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel abrir os avisos"
        description={error}
        onAction={() => void loadNotices()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avisos"
        description="Crie avisos manuais com mensagem, imagem por URL, agendamento e preview visual para uso no painel."
        badge={canEdit ? "Gerenciamento" : "Consulta"}
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/avisos/novo">
                <Plus className="size-4" />
                Novo aviso
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Listagem</CardTitle>
            <CardDescription>
              Consulte os avisos cadastrados, o publico alvo e o agendamento configurado manualmente.
            </CardDescription>
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-3xl border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary/35">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Aviso
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Igreja
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Publico
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Agendamento
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
                  {isLoading && notices.length === 0
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4" colSpan={7}>
                            <div className="h-12 animate-pulse rounded-2xl bg-secondary/60" />
                          </td>
                        </tr>
                      ))
                    : null}

                  {!isLoading && notices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-14 text-center text-sm text-muted-foreground"
                      >
                        Nenhum aviso cadastrado ate o momento.
                      </td>
                    </tr>
                  ) : null}

                  {notices.map((notice) => (
                    <tr key={notice.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{notice.title}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {notice.message}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {notice.churchName || "Geral"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {notice.targetLabel || "Publico geral"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {formatDateTime(notice.scheduledAt)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            notice.status === "SENT"
                              ? "secondary"
                              : notice.status === "READY"
                                ? "default"
                                : "outline"
                          }
                        >
                          {getStatusLabel(notice.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {formatDateTime(notice.updatedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          {canEdit ? (
                            <Button asChild size="sm">
                              <Link href={`/avisos/${notice.id}/editar`}>
                                <Pencil className="size-4" />
                                Editar
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Somente consulta
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
