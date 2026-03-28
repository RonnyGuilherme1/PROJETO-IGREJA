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
  createLeadershipRole,
  getLeadershipRoleById,
  updateLeadershipRole,
} from "@/modules/leadership-roles/services/leadership-roles-service";
import {
  LEADERSHIP_ROLE_STATUS_OPTIONS,
  type CreateLeadershipRolePayload,
  type LeadershipRoleFormValues,
  type UpdateLeadershipRolePayload,
} from "@/modules/leadership-roles/types/leadership-role";

interface LeadershipRoleFormPageProps {
  mode: "create" | "edit";
  leadershipRoleId?: string;
}

const initialFormValues: LeadershipRoleFormValues = {
  name: "",
  description: "",
  active: "ACTIVE",
};

const textareaClassName =
  "flex min-h-28 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function LeadershipRoleFormPage({
  mode,
  leadershipRoleId,
}: LeadershipRoleFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] =
    useState<LeadershipRoleFormValues>(initialFormValues);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "edit" || !leadershipRoleId) {
      setIsLoading(false);
      return;
    }

    const currentLeadershipRoleId = leadershipRoleId;
    let isActive = true;

    async function loadLeadershipRole() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const leadershipRole =
          await getLeadershipRoleById(currentLeadershipRoleId);

        if (!isActive) {
          return;
        }

        setFormValues({
          name: leadershipRole.name,
          description: leadershipRole.description ?? "",
          active: leadershipRole.active ? "ACTIVE" : "INACTIVE",
        });
      } catch (error) {
        if (isActive) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Nao foi possivel carregar os dados do cargo para edicao.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadLeadershipRole();

    return () => {
      isActive = false;
    };
  }, [mode, leadershipRoleId]);

  function handleFieldChange(
    field: keyof LeadershipRoleFormValues,
    value: string,
  ) {
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
        const payload: CreateLeadershipRolePayload = {
          name: formValues.name,
          description: formValues.description,
          active: formValues.active === "ACTIVE",
        };

        await createLeadershipRole(payload);
      } else if (leadershipRoleId) {
        const payload: UpdateLeadershipRolePayload = {
          name: formValues.name,
          description: formValues.description,
          active: formValues.active === "ACTIVE",
        };

        await updateLeadershipRole(leadershipRoleId, payload);
      }

      startTransition(() => {
        router.replace("/cargos-lideranca");
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Nao foi possivel criar o cargo de lideranca."
            : "Nao foi possivel salvar as alteracoes do cargo de lideranca.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <ErrorView
        title="Nao foi possivel abrir este cargo"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Novo cargo de lideranca" : "Editar cargo"}
        description={
          mode === "create"
            ? "Cadastre um novo cargo de lideranca para uso nos cadastros administrativos."
            : "Atualize os dados do cargo mantendo o mesmo padrao visual do painel."
        }
        badge="Cargos de lideranca"
        action={
          <Button asChild variant="outline">
            <Link href="/cargos-lideranca">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Cadastro de cargo" : "Edicao de cargo"}
          </CardTitle>
          <CardDescription>
            Organize os cargos de lideranca disponiveis com nome, descricao e
            status de uso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
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
                  <Label htmlFor="leadership-role-name">Nome</Label>
                  <Input
                    id="leadership-role-name"
                    value={formValues.name}
                    onChange={(event) =>
                      handleFieldChange("name", event.target.value)
                    }
                    placeholder="Nome do cargo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadership-role-status">Status</Label>
                  <Select
                    id="leadership-role-status"
                    value={formValues.active}
                    onChange={(event) =>
                      handleFieldChange("active", event.target.value)
                    }
                  >
                    {LEADERSHIP_ROLE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadership-role-description">Descricao</Label>
                <textarea
                  id="leadership-role-description"
                  className={textareaClassName}
                  value={formValues.description}
                  onChange={(event) =>
                    handleFieldChange("description", event.target.value)
                  }
                  placeholder="Descreva a responsabilidade principal deste cargo"
                />
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
                  {mode === "create" ? "Criar cargo" : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/cargos-lideranca">Cancelar</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
