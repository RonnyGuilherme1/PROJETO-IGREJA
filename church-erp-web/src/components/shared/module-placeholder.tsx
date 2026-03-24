import Link from "next/link";
import { apiConfig } from "@/lib/env";
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
import { Separator } from "@/components/ui/separator";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  hint: string;
}

export function ModulePlaceholder({
  title,
  description,
  hint,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        badge="Modulo administrativo"
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Voltar ao dashboard</Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-dashed bg-white/80">
          <CardHeader>
            <CardTitle>Estrutura inicial pronta</CardTitle>
            <CardDescription>
              Esta rota ja esta preparada para receber listagem, filtros e
              formularios conectados a API REST.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-secondary/70 p-5">
                <p className="text-sm font-medium text-foreground">
                  Layout consistente
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Header, sidebar e espacamento ja seguem o padrao do painel
                  administrativo.
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/70 p-5">
                <p className="text-sm font-medium text-foreground">
                  Integracao centralizada
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  O cliente HTTP ja esta configurado para consumir a API pelo
                  proxy interno em /api.
                </p>
              </div>
            </div>

            <Separator />

            <div className="rounded-2xl border bg-muted/40 p-4">
              <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Ambiente</CardTitle>
            <CardDescription>
              Base do modulo pronta para consumir endpoints reais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                Status da API
              </span>
              <Badge variant={apiConfig.isConfigured ? "secondary" : "outline"}>
                {apiConfig.isConfigured ? "Configurada" : "Pendente"}
              </Badge>
            </div>

            <div className="rounded-2xl border bg-secondary/50 p-4 font-mono text-xs leading-6 text-muted-foreground break-all">
              {apiConfig.baseUrl}
            </div>

            <Button asChild className="w-full">
              <Link href="/login">Abrir tela de login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
