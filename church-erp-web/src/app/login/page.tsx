import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
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
    <div className="relative min-h-screen overflow-hidden bg-[#04110d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(11,95,63,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(186,154,74,0.10),transparent_34%),linear-gradient(160deg,#030b09_0%,#071712_46%,#020806_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
          <section className="max-w-xl">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-start sm:gap-8 lg:gap-10">
              <Image
                src="/platform-logo-full.png"
                alt="Igreja ERP"
                width={260}
                height={173}
                className="h-auto w-[180px] sm:w-[210px] lg:w-[240px] xl:w-[260px]"
                priority
              />
              <div className="space-y-3 sm:max-w-sm lg:max-w-md">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d7c06a]">
                  Acesso ao painel
                </p>
                <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Gestao da igreja em um fluxo simples e direto.
                </h1>
                <p className="max-w-md text-base leading-7 text-[#c6d5cf]">
                  Entre com as credenciais do seu ambiente para continuar.
                </p>
              </div>
            </div>
          </section>

          <Card className="relative overflow-hidden !border-transparent bg-[#0d1613]/82 text-white shadow-[0_22px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),transparent_32%)] pointer-events-none" />
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#d7c06a]/20 to-transparent" />

            <CardHeader className="space-y-5 p-6 sm:p-8">
              <Badge className="w-fit border border-[#d7c06a]/25 bg-[#d7c06a]/10 text-[#f0df9d] hover:bg-[#d7c06a]/10">
                Login
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-3xl text-white sm:text-[2rem]">
                  Entrar
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-[#9eb1a9]">
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
