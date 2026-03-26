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
  canManagePlatformUsers,
  getMasterAccessLabel,
} from "@/modules/master/lib/master-access";
import {
  createMasterPlatformUser,
  getMasterPlatformUserById,
  updateMasterPlatformUser,
} from "@/modules/master/services/master-platform-users-service";
import { getStoredMasterUser } from "@/modules/master/services/master-session-service";
import {
  PLATFORM_SUPPORT_ROLE_OPTION,
  PLATFORM_USER_ROLE_OPTIONS,
  PLATFORM_USER_STATUS_OPTIONS,
  type CreatePlatformUserPayload,
  type PlatformUserFormValues,
  type PlatformUserItem,
  type UpdatePlatformUserPayload,
} from "@/modules/master/types/platform-user";

interface PlatformUserFormPageProps {
  mode: "create" | "edit";
  userId?: string;
}

const initialFormValues: PlatformUserFormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
  platformRole: "",
  status: "ACTIVE",
};

export function PlatformUserFormPage({
  mode,
  userId,
}: PlatformUserFormPageProps) {
  const router = useRouter();
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<
    typeof getStoredMasterUser
  >>(null);
  const canManageUsers = canManagePlatformUsers(currentUser);
  const [formValues, setFormValues] =
    useState<PlatformUserFormValues>(initialFormValues);
  const [loadedUser, setLoadedUser] = useState<PlatformUserItem | null>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    setCurrentUser(getStoredMasterUser());
    setIsSessionReady(true);
  }, []);

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    if (!canManageUsers) {
      router.replace("/master/dashboard");
    }
  }, [canManageUsers, isSessionReady, router]);

  useEffect(() => {
    let isActive = true;

    async function loadUser() {
      if (mode !== "edit" || !userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const user = await getMasterPlatformUserById(userId);

        if (!isActive) {
          return;
        }

        setLoadedUser(user);
        setFormValues({
          name: user.name,
          username: user.username ?? "",
          email: user.email ?? "",
          password: "",
          platformRole: user.platformRole,
          status: user.status,
        });
      } catch (error) {
        if (isActive) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Nao foi possivel carregar os dados do usuario master.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    if (!isSessionReady) {
      return;
    }

    if (!canManageUsers) {
      setIsLoading(false);
      return;
    }

    void loadUser();

    return () => {
      isActive = false;
    };
  }, [canManageUsers, isSessionReady, mode, userId]);

  function handleFieldChange(
    field: keyof PlatformUserFormValues,
    value: string,
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageUsers) {
      setSubmitError(
        "Apenas administradores da plataforma podem gerenciar usuarios master.",
      );
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const payload: CreatePlatformUserPayload = {
          name: formValues.name,
          username: formValues.username,
          email: formValues.email,
          password: formValues.password,
          platformRole:
            formValues.platformRole as CreatePlatformUserPayload["platformRole"],
          status: formValues.status,
        };

        await createMasterPlatformUser(payload);
      } else if (userId) {
        const payload: UpdatePlatformUserPayload = {
          name: formValues.name,
          username: formValues.username,
          email: formValues.email,
          password: formValues.password || undefined,
          platformRole: formValues.platformRole || undefined,
          status: formValues.status,
        };

        await updateMasterPlatformUser(userId, payload);
      }

      startTransition(() => {
        router.replace("/master/usuarios");
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Nao foi possivel criar o usuario da plataforma."
            : "Nao foi possivel salvar as alteracoes do usuario da plataforma.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isSessionReady) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={mode === "create" ? "Novo usuario master" : "Editar usuario master"}
          description="Carregando permissoes da area master."
          badge="Plataforma"
        />

        <Card className="bg-[color:var(--surface-soft)]">
          <CardHeader>
            <CardTitle>
              {mode === "create" ? "Cadastro" : "Edicao de usuario"}
            </CardTitle>
            <CardDescription>
              Validando permissao de acesso e carregando os dados da tela.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageUsers) {
    return null;
  }

  if (loadError) {
    return (
      <ErrorView
        title="Nao foi possivel abrir este usuario master"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  const isProtectedUser = loadedUser?.isSystemProtected ?? false;
  const roleOptions =
    mode === "edit" && loadedUser?.platformRole === "PLATFORM_SUPPORT"
      ? [...PLATFORM_USER_ROLE_OPTIONS, PLATFORM_SUPPORT_ROLE_OPTION]
      : PLATFORM_USER_ROLE_OPTIONS;

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Novo usuario master" : "Editar usuario master"}
        description={
          mode === "create"
            ? "Cadastre administradores da plataforma e operadores que atuam somente sobre ambientes."
            : "Atualize dados do usuario da plataforma respeitando as protecoes do sistema."
        }
        badge={getMasterAccessLabel(currentUser)}
        action={
          <Button asChild variant="outline">
            <Link href="/master/usuarios">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-[color:var(--surface-soft)]">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Cadastro" : "Edicao de usuario"}
          </CardTitle>
          <CardDescription>
            O backend continua como fonte de verdade para as permissoes de usuarios da plataforma.
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
              {isProtectedUser ? (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
                  Este usuario e protegido pelo sistema. Nome, e-mail e senha podem
                  ser ajustados, mas status e papel permanecem bloqueados para evitar
                  inativacao ou rebaixamento do master raiz.
                </div>
              ) : null}

              {mode === "create" ? (
                <div className="rounded-2xl border border-border bg-[color:var(--surface-base)] px-4 py-3 text-sm leading-6 text-muted-foreground">
                  Administradores da plataforma podem criar novos usuarios master.
                  Operadores permanecem restritos a ambientes e nao criam outros
                  usuarios da plataforma.
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-user-name">Nome</Label>
                  <Input
                    id="platform-user-name"
                    value={formValues.name}
                    onChange={(event) =>
                      handleFieldChange("name", event.target.value)
                    }
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform-user-email">E-mail</Label>
                  <Input
                    id="platform-user-email"
                    type="email"
                    value={formValues.email}
                    onChange={(event) =>
                      handleFieldChange("email", event.target.value)
                    }
                    placeholder="usuario@plataforma.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform-user-username">Username</Label>
                  <Input
                    id="platform-user-username"
                    value={formValues.username}
                    onChange={(event) =>
                      handleFieldChange("username", event.target.value)
                    }
                    placeholder="usuario.master"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform-user-password">
                    {mode === "create" ? "Senha" : "Nova senha"}
                  </Label>
                  <Input
                    id="platform-user-password"
                    type="password"
                    value={formValues.password}
                    onChange={(event) =>
                      handleFieldChange("password", event.target.value)
                    }
                    placeholder={
                      mode === "create"
                        ? "Defina uma senha inicial"
                        : "Preencha apenas para alterar"
                    }
                    required={mode === "create"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform-user-role">Papel</Label>
                  <Select
                    id="platform-user-role"
                    value={formValues.platformRole}
                    onChange={(event) =>
                      handleFieldChange("platformRole", event.target.value)
                    }
                    required
                    disabled={isProtectedUser}
                  >
                    <option value="" disabled>
                      Selecione um papel
                    </option>
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {formValues.platformRole === "PLATFORM_OPERATOR"
                      ? "Este perfil opera ambientes e nao cria outros usuarios master."
                      : formValues.platformRole === "PLATFORM_SUPPORT"
                        ? "Perfil legado mantido sem ampliacao de poderes."
                        : "Administradores podem gerenciar usuarios da plataforma e ambientes."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform-user-status">Status</Label>
                  <Select
                    id="platform-user-status"
                    value={formValues.status}
                    onChange={(event) =>
                      handleFieldChange("status", event.target.value)
                    }
                    disabled={isProtectedUser}
                  >
                    {PLATFORM_USER_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
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
                  {mode === "create" ? "Criar usuario master" : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/master/usuarios">Cancelar</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
