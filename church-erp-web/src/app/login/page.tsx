import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
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

export default async function LoginPage() {
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,91,73,0.16),transparent_35%),linear-gradient(135deg,#f8faf7_0%,#edf3ee_50%,#f9fbf8_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.08fr)_420px]">
          <section className="hidden rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-xl backdrop-blur xl:block">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Building2 className="size-6" />
            </div>

            <div className="mt-8 space-y-4">
              <Badge className="w-fit">Church ERP Web</Badge>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
                Gestao administrativa unificada para a operacao da igreja
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                O Church ERP concentra autenticacao, dashboard, membros,
                igrejas, tesouraria e usuarios em uma experiencia unica para
                cada ambiente.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border bg-white/80 p-5">
                <p className="text-sm font-semibold text-foreground">
                  Modulos integrados
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Dashboard, membros, igrejas, tesouraria e usuarios operam no
                  mesmo painel administrativo.
                </p>
              </div>

              <div className="rounded-3xl border bg-white/80 p-5">
                <p className="text-sm font-semibold text-foreground">
                  Experiencia consistente
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  O painel mantem a mesma linguagem visual em desktop e mobile.
                </p>
              </div>

              <div className="rounded-3xl border bg-white/80 p-5 md:col-span-2">
                <p className="text-sm font-semibold text-foreground">
                  Operacao centralizada
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Tudo o que voce precisa para acompanhar a rotina da igreja em
                  um unico painel.
                </p>
              </div>
            </div>
          </section>

          <Card className="border-white/60 bg-white/90 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-4">
              <Badge className="w-fit">Acesso ao painel</Badge>
              <div className="space-y-2">
                <CardTitle className="text-3xl">Entrar no painel</CardTitle>
                <CardDescription className="text-sm leading-6">
                  Acesse o painel administrativo do ambiente com codigo, usuario
                  e senha.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <LoginForm mode="TENANT" />

              <div className="rounded-2xl bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">
                Use as credenciais do seu ambiente para acompanhar a operacao
                com seguranca e continuidade.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
