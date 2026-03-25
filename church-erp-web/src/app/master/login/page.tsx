import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldUser } from "lucide-react";
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
  MASTER_AUTH_SESSION_COOKIE,
  MASTER_AUTH_TOKEN_COOKIE,
  getStoredAuthUser,
} from "@/modules/auth/lib/auth-session";

export default async function MasterLoginPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(MASTER_AUTH_TOKEN_COOKIE)?.value;

  if (accessToken) {
    const user = getStoredAuthUser(
      accessToken,
      cookieStore.get(MASTER_AUTH_SESSION_COOKIE)?.value,
    );

    if (user?.accessType === "PLATFORM") {
      redirect("/master/dashboard");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07110f] text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,91,73,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(7,17,15,0.72),transparent_42%),linear-gradient(160deg,#050816_0%,#08110f_48%,#050816_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.9fr)_420px] lg:items-center">
          <section className="hidden max-w-lg space-y-5 lg:block">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.06] bg-black/15 px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-200">
                <ShieldUser className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-white">
                  Plataforma master
                </p>
                <p className="text-xs text-slate-500">Acesso restrito</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300/70">
                Area reservada
              </p>
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white">
                Entrada dedicada para a administracao da plataforma.
              </h1>
              <p className="max-w-md text-base leading-7 text-slate-400">
                Use suas credenciais master para acessar o painel global.
              </p>
            </div>
          </section>

          <Card className="relative overflow-hidden border-white/[0.06] bg-[#0f1515]/84 text-slate-50 shadow-[0_32px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_30%)] pointer-events-none" />
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/[0.12] to-transparent" />

            <CardHeader className="space-y-5 p-6 sm:p-8">
              <Badge className="w-fit border border-emerald-400/[0.12] bg-emerald-500/[0.08] text-emerald-100 hover:bg-emerald-500/[0.08]">
                Master
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-3xl text-white">Entrar como master</CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-400">
                  Informe usuario e senha para continuar.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
              <LoginForm mode="MASTER" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
