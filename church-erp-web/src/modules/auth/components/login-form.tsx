"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import { cn } from "@/lib/utils";
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
  const labelClassName = isTenantMode
    ? "text-sm font-medium text-[#d8e6df]"
    : "text-sm font-medium text-slate-300";
  const inputClassName = isTenantMode
    ? "h-12 rounded-2xl !border-transparent !shadow-none bg-[#0d1815] px-4 text-base text-[#f4f7f5] placeholder:text-[#82948c] focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-[#d7c06a]/35"
    : "h-12 rounded-2xl !border-transparent !shadow-none bg-[#151c1c] px-4 text-base text-slate-100 placeholder:text-slate-500 focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-emerald-500/20";
  const buttonClassName = isTenantMode
    ? "h-12 rounded-2xl bg-[#0f4a36] text-[#f8fbf9] shadow-[0_12px_24px_rgba(15,74,54,0.22)] hover:bg-[#0b3c2b]"
    : "h-12 rounded-2xl bg-[#2b3232] text-slate-100 shadow-[0_10px_22px_rgba(0,0,0,0.12)] hover:bg-[#353d3d]";
  const errorClassName = isTenantMode
    ? "border-rose-500/[0.18] bg-rose-500/[0.1] text-rose-100"
    : "border-rose-500/[0.15] bg-rose-500/[0.08] text-rose-100";
  const successClassName = isTenantMode
    ? "border-[#0f4a36]/30 bg-[#0f4a36]/16 text-[#d9efe5]"
    : "border-emerald-500/[0.15] bg-emerald-500/[0.08] text-emerald-100";
  const submitLabel = isTenantMode
    ? "Entrar no painel"
    : "Entrar como master";

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
          "Nao foi possivel entrar. Revise suas credenciais e tente novamente.",
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
          <Label htmlFor="tenantCode" className={labelClassName}>
            {"Banco"}
          </Label>
          <Input
            id="tenantCode"
            type="text"
            autoComplete="organization"
            className={inputClassName}
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
        <Label htmlFor="username" className={labelClassName}>
          {"Usu\u00e1rio"}
        </Label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          className={inputClassName}
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
        <Label htmlFor="password" className={labelClassName}>
          {"Senha"}
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          className={inputClassName}
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
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            errorClassName,
          )}
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            successClassName,
          )}
        >
          {success}
        </div>
      ) : null}

      <Button
        type="submit"
        className={cn("w-full", buttonClassName)}
        disabled={isLoading}
      >
        {isLoading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        {submitLabel}
      </Button>
    </form>
  );
}
