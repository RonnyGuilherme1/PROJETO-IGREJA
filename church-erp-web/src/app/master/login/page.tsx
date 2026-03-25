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
import { MasterThemeScope } from "@/modules/master/components/master-theme-scope";
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
    <MasterThemeScope>
      <div className="relative min-h-screen overflow-hidden">
        <div className="master-login-backdrop absolute inset-0" />
        <div className="master-login-top-line absolute inset-x-0 top-0 h-px" />

        <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.9fr)_420px] lg:items-center">
            <section className="hidden max-w-lg space-y-5 lg:block">
              <div className="master-login-chip inline-flex items-center gap-3 rounded-full px-4 py-3 backdrop-blur">
                <div className="master-login-chip-icon flex size-10 items-center justify-center rounded-full">
                  <ShieldUser className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="master-login-chip-title text-sm font-semibold">
                    Plataforma master
                  </p>
                  <p className="master-login-chip-subtitle text-xs">
                    Acesso restrito
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="master-login-eyebrow text-xs font-semibold uppercase tracking-[0.32em]">
                  Area reservada
                </p>
                <h1 className="master-login-hero-title max-w-md text-4xl font-semibold tracking-tight">
                  Entrada dedicada para a administracao da plataforma.
                </h1>
                <p className="master-login-hero-body max-w-md text-base leading-7">
                  Use suas credenciais master para acessar o painel global.
                </p>
              </div>
            </section>

            <Card className="master-login-card relative overflow-hidden">
              <div className="master-login-card-highlight pointer-events-none absolute inset-0" />
              <div className="master-login-card-line absolute inset-x-10 top-0 h-px" />

              <CardHeader className="space-y-5 p-6 sm:p-8">
                <Badge className="master-login-badge w-fit">Master</Badge>
                <div className="space-y-2">
                  <CardTitle className="master-login-hero-title text-3xl">
                    Entrar como master
                  </CardTitle>
                  <CardDescription className="master-login-card-description text-sm leading-6">
                    Informe usuario e senha para continuar.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
                <div className="master-login-form">
                  <LoginForm mode="MASTER" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MasterThemeScope>
  );
}
