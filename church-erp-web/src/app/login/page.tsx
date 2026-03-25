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

    if (user?.accessType === "TENANT") {
      redirect("/dashboard");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.65),transparent_38%),linear-gradient(160deg,#040712_0%,#08111c_46%,#030712_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
          <section className="mx-auto max-w-xl space-y-6 lg:mx-0">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-200">
                <Building2 className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-white">Church ERP Web</p>
                <p className="text-xs text-slate-400">
                  Painel administrativo
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300/80">
                Acesso ao painel
              </p>
              <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Gestao da igreja em um fluxo simples e direto.
              </h1>
              <p className="max-w-md text-base leading-7 text-slate-300">
                Entre com as credenciais do seu ambiente para continuar.
              </p>
            </div>
          </section>

          <Card className="relative overflow-hidden border-white/10 bg-[#0d131d]/86 text-white shadow-[0_28px_80px_rgba(3,7,18,0.45)] backdrop-blur">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />

            <CardHeader className="space-y-5 p-6 sm:p-8">
              <Badge className="w-fit border border-emerald-400/15 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/10">
                Login
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-3xl text-white sm:text-[2rem]">
                  Entrar
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-400">
                  Use banco, usuario e senha para acessar o painel.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
              <LoginForm mode="TENANT" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
