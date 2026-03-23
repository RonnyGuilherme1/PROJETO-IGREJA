"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import { ErrorView } from "@/components/shared/error-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  createUser,
  getUserById,
  updateUser,
} from "@/modules/users/services/users-service";
import {
  USER_STATUS_OPTIONS,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserFormValues,
} from "@/modules/users/types/user";

interface UserFormPageProps {
  mode: "create" | "edit";
  userId?: string;
}

const initialFormValues: UserFormValues = {
  name: "",
  email: "",
  password: "",
  role: "",
  status: "ACTIVE",
  churchId: "",
};

export function UserFormPage({ mode, userId }: UserFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<UserFormValues>(initialFormValues);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "edit" || !userId) {
      return;
    }

    const currentUserId = userId;
    let isActive = true;

    async function loadUser() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const user = await getUserById(currentUserId);

        if (!isActive) {
          return;
        }

        setFormValues({
          name: user.name,
          email: user.email,
          password: "",
          role: user.role,
          status: user.status || "ACTIVE",
          churchId: user.churchId ?? "",
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(
          getApiErrorMessage(
            error,
            "Nao foi possivel carregar os dados do usuario para edicao.",
          ),
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      isActive = false;
    };
  }, [mode, userId]);

  function handleFieldChange(field: keyof UserFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const payload: CreateUserPayload = {
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          role: formValues.role,
          status: formValues.status,
          churchId: formValues.churchId || undefined,
        };

        await createUser(payload);
      } else if (userId) {
        const payload: UpdateUserPayload = {
          name: formValues.name,
          email: formValues.email,
          role: formValues.role,
          status: formValues.status,
          churchId: formValues.churchId || undefined,
        };

        await updateUser(userId, payload);
      }

      startTransition(() => {
        router.replace("/usuarios");
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Nao foi possivel criar o usuario."
            : "Nao foi possivel salvar as alteracoes do usuario.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <ErrorView
        title="Falha ao carregar usuario"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Novo usuario" : "Editar usuario"}
        description={
          mode === "create"
            ? "Preencha os dados para cadastrar um novo usuario na plataforma."
            : "Atualize os dados do usuario mantendo o mesmo padrao administrativo do painel."
        }
        badge="Modulo de usuarios"
        action={
          <Button asChild variant="outline">
            <Link href="/usuarios">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Cadastro" : "Edicao de usuario"}
          </CardTitle>
          <CardDescription>
            Campos obrigatorios organizados para manter a manutencao de usuarios
            simples e consistente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome</Label>
                  <Input
                    id="user-name"
                    value={formValues.name}
                    onChange={(event) =>
                      handleFieldChange("name", event.target.value)
                    }
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-email">E-mail</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={formValues.email}
                    onChange={(event) =>
                      handleFieldChange("email", event.target.value)
                    }
                    placeholder="usuario@igreja.org.br"
                    required
                  />
                </div>

                {mode === "create" ? (
                  <div className="space-y-2">
                    <Label htmlFor="user-password">Senha</Label>
                    <Input
                      id="user-password"
                      type="password"
                      value={formValues.password}
                      onChange={(event) =>
                        handleFieldChange("password", event.target.value)
                      }
                      placeholder="Defina uma senha inicial"
                      required
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="user-role">Perfil</Label>
                  <Input
                    id="user-role"
                    value={formValues.role}
                    onChange={(event) =>
                      handleFieldChange("role", event.target.value)
                    }
                    placeholder="Ex.: ADMIN"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-status">Status</Label>
                  <Select
                    id="user-status"
                    value={formValues.status}
                    onChange={(event) =>
                      handleFieldChange("status", event.target.value)
                    }
                  >
                    {USER_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-churchId">Church ID</Label>
                  <Input
                    id="user-churchId"
                    value={formValues.churchId}
                    onChange={(event) =>
                      handleFieldChange("churchId", event.target.value)
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {submitError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting || isRedirecting}>
                  {isSubmitting || isRedirecting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {mode === "create" ? "Criar usuario" : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/usuarios">Cancelar</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
