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
import { listChurches } from "@/modules/churches/services/churches-service";
import {
  createUser,
  getUserById,
  updateUser,
} from "@/modules/users/services/users-service";
import {
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserFormValues,
} from "@/modules/users/types/user";

interface UserFormPageProps {
  mode: "create" | "edit";
  userId?: string;
}

interface ChurchOption {
  id: string;
  name: string;
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
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [churchesResponse, userResponse] = await Promise.all([
          listChurches({ name: "", status: "" }),
          mode === "edit" && userId ? getUserById(userId) : Promise.resolve(null),
        ]);

        if (!isActive) {
          return;
        }

        const nextChurchOptions = churchesResponse.items.map((church) => ({
          id: church.id,
          name: church.name,
        }));
        const singleChurchId =
          nextChurchOptions.length === 1 ? nextChurchOptions[0].id : "";

        setChurchOptions(nextChurchOptions);

        if (userResponse) {
          setFormValues({
            name: userResponse.name,
            email: userResponse.email,
            password: "",
            role: userResponse.role,
            status: userResponse.status || "ACTIVE",
            churchId: userResponse.churchId ?? singleChurchId,
          });
        } else {
          setFormValues((current) => ({
            ...current,
            churchId: singleChurchId,
          }));
        }
      } catch (error) {
        if (isActive) {
          setLoadError(
            getApiErrorMessage(
              error,
              mode === "create"
                ? "Nao foi possivel carregar os dados iniciais do formulario."
                : "Nao foi possivel carregar os dados do usuario para edicao.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isActive = false;
    };
  }, [mode, userId]);

  const hasSingleChurch = churchOptions.length === 1;
  const hasMultipleChurches = churchOptions.length > 1;

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
          churchId: formValues.churchId || null,
        };

        await createUser(payload);
      } else if (userId) {
        const payload: UpdateUserPayload = {
          name: formValues.name,
          email: formValues.email,
          role: formValues.role,
          status: formValues.status,
          churchId: formValues.churchId || null,
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
                  <Select
                    id="user-role"
                    value={formValues.role}
                    onChange={(event) =>
                      handleFieldChange("role", event.target.value)
                    }
                    required
                  >
                    <option value="" disabled>
                      Selecione um perfil
                    </option>
                    {USER_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
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

                {hasMultipleChurches ? (
                  <div className="space-y-2">
                    <Label htmlFor="user-churchId">Igreja</Label>
                    <Select
                      id="user-churchId"
                      value={formValues.churchId}
                      onChange={(event) =>
                        handleFieldChange("churchId", event.target.value)
                      }
                    >
                      <option value="">Sem igreja vinculada</option>
                      {churchOptions.map((church) => (
                        <option key={church.id} value={church.id}>
                          {church.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}
              </div>

              {hasSingleChurch ? (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
                  Igreja vinculada automaticamente:{" "}
                  <strong>{churchOptions[0]?.name}</strong>.
                </div>
              ) : null}

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
