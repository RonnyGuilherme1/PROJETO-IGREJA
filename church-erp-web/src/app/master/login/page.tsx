import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldUser } from "lucide-react";
import { apiConfig } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/modules/auth/components/login-form";
import {
  AUTH_SESSION_COOKIE,
  AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";

export default async function MasterLoginPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (accessToken) {
    const user = getStoredAuthUser(
      accessToken,
      cookieStore.get(AUTH_SESSION_COOKIE)?.value,
    );

    redirect(user?.accessType === "PLATFORM" ? "/master/dashboard" : "/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(18,62,95,0.18),transparent_35%),linear-gradient(135deg,#f6f9fc_0%,#eef3f9_55%,#f9fbfd_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.08fr)_420px]">
          <section className="hidden rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-xl backdrop-blur xl:block">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <ShieldUser className="size-6" />
            </div>

            <div className="mt-8 space-y-4">
              <Badge className="w-fit bg-slate-900 text-white hover:bg-slate-900">
                Plataforma Master
              </Badge>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
                Acesso central da plataforma para operacao administrativa global
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Este fluxo atende a autenticacao master da plataforma,
                preservando o painel interno e o cliente HTTP centralizado para
                consumir a API real.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border bg-white/80 p-5">
                <p className="text-sm font-semibold text-foreground">
                  Fluxo separado
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  O login master usa rota dedicada e mantem a sessao isolada no
                  mesmo padrao do frontend.
                </p>
              </div>

              <div className="rounded-3xl border bg-white/80 p-5">
                <p className="text-sm font-semibold text-foreground">
                  Protecao de rotas
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  O painel continua exigindo autenticacao valida antes de liberar
                  o acesso as paginas internas.
                </p>
              </div>

              <div className="rounded-3xl border bg-white/80 p-5 md:col-span-2">
                <p className="text-sm font-semibold text-foreground">
                  Proxy local da API
                </p>
                <p className="mt-2 font-mono text-xs leading-6 text-muted-foreground break-all">
                  {apiConfig.baseUrl}
                </p>
              </div>
            </div>
          </section>

          <Card className="border-white/60 bg-white/90 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-4">
              <Badge variant={apiConfig.isConfigured ? "secondary" : "outline"} className="w-fit">
                {apiConfig.isConfigured ? "API configurada" : "API pendente"}
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-3xl">Entrar como master</CardTitle>
                <CardDescription className="text-sm leading-6">
                  Acesse a plataforma com usuario e senha, sessao persistida e
                  tratamento basico de erro.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <LoginForm mode="MASTER" />

              <div className="rounded-2xl bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">
                O frontend consome o backend pelo proxy interno em{" "}
                <strong>/api</strong>, sem depender de IP fixo no{" "}
                <strong>.env</strong>.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
