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
  createMasterTenant,
  getMasterTenantById,
  updateMasterTenant,
} from "@/modules/master/services/master-tenants-service";
import {
  MASTER_TENANT_STATUS_OPTIONS,
  type CreateMasterTenantPayload,
  type MasterTenantFormValues,
  type UpdateMasterTenantPayload,
} from "@/modules/master/types/tenant";

interface TenantFormPageProps {
  mode: "create" | "edit";
  tenantId?: string;
}

const initialFormValues: MasterTenantFormValues = {
  name: "",
  code: "",
  status: "ACTIVE",
  adminName: "",
  adminUsername: "",
  adminEmail: "",
  adminPassword: "",
};

export function TenantFormPage({ mode, tenantId }: TenantFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<MasterTenantFormValues>(initialFormValues);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirecting, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "edit" || !tenantId) {
      return;
    }

    const currentTenantId = tenantId;
    let isActive = true;

    async function loadTenant() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const tenant = await getMasterTenantById(currentTenantId);

        if (!isActive) {
          return;
        }

        setFormValues({
          name: tenant.name,
          code: tenant.code,
          status: tenant.status || "ACTIVE",
          adminName: "",
          adminUsername: "",
          adminEmail: "",
          adminPassword: "",
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(
          getApiErrorMessage(
            error,
            "Nao foi possivel carregar os dados do tenant para edicao.",
          ),
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadTenant();

    return () => {
      isActive = false;
    };
  }, [mode, tenantId]);

  function handleFieldChange(field: keyof MasterTenantFormValues, value: string) {
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
        const payload: CreateMasterTenantPayload = {
          name: formValues.name,
          code: formValues.code,
          status: formValues.status,
          adminName: formValues.adminName,
          adminUsername: formValues.adminUsername,
          adminEmail: formValues.adminEmail,
          adminPassword: formValues.adminPassword,
        };

        await createMasterTenant(payload);
      } else if (tenantId) {
        const payload: UpdateMasterTenantPayload = {
          name: formValues.name,
          code: formValues.code,
          status: formValues.status,
        };

        await updateMasterTenant(tenantId, payload);
      }

      startTransition(() => {
        router.replace("/master/tenants");
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Nao foi possivel criar o tenant."
            : "Nao foi possivel salvar as alteracoes do tenant.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <ErrorView
        title="Falha ao carregar tenant"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Novo tenant" : "Editar tenant"}
        description={
          mode === "create"
            ? "Cadastre um novo cliente da plataforma e defina o administrador inicial do ambiente."
            : "Atualize os dados principais do tenant mantendo o mesmo padrao visual da area master."
        }
        badge="Area master"
        action={
          <Button asChild variant="outline">
            <Link href="/master/tenants">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Cadastro" : "Edicao de tenant"}</CardTitle>
          <CardDescription>
            Dados organizados para criar e manter clientes da plataforma com consistencia.
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
                  <Label htmlFor="tenant-name">Nome do tenant</Label>
                  <Input
                    id="tenant-name"
                    value={formValues.name}
                    onChange={(event) =>
                      handleFieldChange("name", event.target.value)
                    }
                    placeholder="Igreja Sede"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant-code">Codigo do tenant</Label>
                  <Input
                    id="tenant-code"
                    value={formValues.code}
                    onChange={(event) =>
                      handleFieldChange("code", event.target.value)
                    }
                    placeholder="igreja-sede"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant-status">Status</Label>
                  <Select
                    id="tenant-status"
                    value={formValues.status}
                    onChange={(event) =>
                      handleFieldChange("status", event.target.value)
                    }
                  >
                    {MASTER_TENANT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {mode === "create" ? (
                <div className="space-y-4 rounded-3xl border border-border bg-secondary/30 p-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      Admin inicial do tenant
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Este usuario sera criado junto com o tenant para o primeiro acesso.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tenant-admin-name">Nome</Label>
                      <Input
                        id="tenant-admin-name"
                        value={formValues.adminName}
                        onChange={(event) =>
                          handleFieldChange("adminName", event.target.value)
                        }
                        placeholder="Administrador inicial"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant-admin-username">Usuario</Label>
                      <Input
                        id="tenant-admin-username"
                        value={formValues.adminUsername}
                        onChange={(event) =>
                          handleFieldChange("adminUsername", event.target.value)
                        }
                        placeholder="admin.local"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant-admin-email">E-mail</Label>
                      <Input
                        id="tenant-admin-email"
                        type="email"
                        value={formValues.adminEmail}
                        onChange={(event) =>
                          handleFieldChange("adminEmail", event.target.value)
                        }
                        placeholder="admin@cliente.org.br"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant-admin-password">Senha inicial</Label>
                      <Input
                        id="tenant-admin-password"
                        type="password"
                        value={formValues.adminPassword}
                        onChange={(event) =>
                          handleFieldChange("adminPassword", event.target.value)
                        }
                        placeholder="Defina uma senha inicial"
                        required
                      />
                    </div>
                  </div>
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
                  {mode === "create" ? "Criar tenant" : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/master/tenants">Cancelar</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
