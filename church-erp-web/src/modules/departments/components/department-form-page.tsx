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
  createDepartment,
  getDepartmentById,
  updateDepartment,
} from "@/modules/departments/services/departments-service";
import {
  DEPARTMENT_STATUS_OPTIONS,
  type CreateDepartmentPayload,
  type DepartmentFormValues,
  type UpdateDepartmentPayload,
} from "@/modules/departments/types/department";

interface DepartmentFormPageProps {
  mode: "create" | "edit";
  departmentId?: string;
}

const initialFormValues: DepartmentFormValues = {
  name: "",
  description: "",
  active: "ACTIVE",
};

const textareaClassName =
  "flex min-h-28 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function DepartmentFormPage({
  mode,
  departmentId,
}: DepartmentFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] =
    useState<DepartmentFormValues>(initialFormValues);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "edit" || !departmentId) {
      setIsLoading(false);
      return;
    }

    const currentDepartmentId = departmentId;
    let isActive = true;

    async function loadDepartment() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const department = await getDepartmentById(currentDepartmentId);

        if (!isActive) {
          return;
        }

        setFormValues({
          name: department.name,
          description: department.description ?? "",
          active: department.active ? "ACTIVE" : "INACTIVE",
        });
      } catch (error) {
        if (isActive) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Nao foi possivel carregar os dados do departamento para edicao.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadDepartment();

    return () => {
      isActive = false;
    };
  }, [mode, departmentId]);

  function handleFieldChange(field: keyof DepartmentFormValues, value: string) {
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
        const payload: CreateDepartmentPayload = {
          name: formValues.name,
          description: formValues.description,
          active: formValues.active === "ACTIVE",
        };

        await createDepartment(payload);
      } else if (departmentId) {
        const payload: UpdateDepartmentPayload = {
          name: formValues.name,
          description: formValues.description,
          active: formValues.active === "ACTIVE",
        };

        await updateDepartment(departmentId, payload);
      }

      startTransition(() => {
        router.replace("/departamentos");
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Nao foi possivel criar o departamento."
            : "Nao foi possivel salvar as alteracoes do departamento.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <ErrorView
        title="Nao foi possivel abrir este departamento"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Novo departamento" : "Editar departamento"}
        description={
          mode === "create"
            ? "Cadastre um novo departamento para organizar as areas da igreja."
            : "Atualize os dados do departamento mantendo o mesmo padrao visual do painel."
        }
        badge="Departamentos"
        action={
          <Button asChild variant="outline">
            <Link href="/departamentos">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>
            {mode === "create"
              ? "Cadastro de departamento"
              : "Edicao de departamento"}
          </CardTitle>
          <CardDescription>
            Organize os departamentos com nome, descricao e status de uso no
            painel administrativo.
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
                  <Label htmlFor="department-name">Nome</Label>
                  <Input
                    id="department-name"
                    value={formValues.name}
                    onChange={(event) =>
                      handleFieldChange("name", event.target.value)
                    }
                    placeholder="Nome do departamento"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department-status">Status</Label>
                  <Select
                    id="department-status"
                    value={formValues.active}
                    onChange={(event) =>
                      handleFieldChange("active", event.target.value)
                    }
                  >
                    {DEPARTMENT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department-description">Descricao</Label>
                <textarea
                  id="department-description"
                  className={textareaClassName}
                  value={formValues.description}
                  onChange={(event) =>
                    handleFieldChange("description", event.target.value)
                  }
                  placeholder="Descreva a finalidade deste departamento"
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
                  {mode === "create"
                    ? "Criar departamento"
                    : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/departamentos">Cancelar</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
