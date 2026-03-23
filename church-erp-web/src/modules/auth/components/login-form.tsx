"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { persistAuthSession } from "@/modules/auth/lib/auth-session";
import {
  loginMaster,
  loginTenant,
} from "@/modules/auth/services/auth-service";
import type { AuthMode } from "@/modules/auth/types/auth";

interface LoginFormProps {
  mode: AuthMode;
}

const initialState = {
  tenantCode: "",
  username: "",
  password: "",
};

export function LoginForm({ mode }: LoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isTenantMode = mode === "TENANT";
  const isLoading = isSubmitting || isRedirecting;
  const successRedirectPath = isTenantMode ? "/dashboard" : "/master/dashboard";
  const targetLoginLabel = isTenantMode ? "acesso do tenant" : "acesso master";
  const switchHref = isTenantMode ? "/master/login" : "/login";
  const switchLabel = isTenantMode
    ? "Entrar como master"
    : "Entrar no tenant";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const session = isTenantMode
        ? await loginTenant({
            tenantCode: formData.tenantCode,
            username: formData.username,
            password: formData.password,
          })
        : await loginMaster({
            username: formData.username,
            password: formData.password,
          });

      persistAuthSession(session);

      setSuccess("Login realizado com sucesso. Redirecionando...");
      startTransition(() => {
        router.replace(successRedirectPath);
        router.refresh();
      });
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "Nao foi possivel entrar. Verifique suas credenciais e a API.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isTenantMode ? (
        <div className="space-y-2">
          <Label htmlFor="tenantCode">Codigo do tenant</Label>
          <Input
            id="tenantCode"
            type="text"
            autoComplete="organization"
            placeholder="igreja-sede"
            value={formData.tenantCode}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                tenantCode: event.target.value,
              }))
            }
            required
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          placeholder={isTenantMode ? "admin.local" : "master.admin"}
          value={formData.username}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              username: event.target.value,
            }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          value={formData.password}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          required
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        Entrar
      </Button>

      <div className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          O formulario envia as credenciais para o endpoint correspondente ao{" "}
          <strong>{targetLoginLabel}</strong>, armazena o token da sessao e
          libera o acesso ao painel interno.
        </p>

        <p>
          Precisa trocar o tipo de acesso?{" "}
          <Link href={switchHref} className="font-semibold text-primary hover:underline">
            {switchLabel}
          </Link>
        </p>
      </div>
    </form>
  );
}
