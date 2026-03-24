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
  createMember,
  getMemberById,
  updateMember,
} from "@/modules/members/services/members-service";
import {
  MEMBER_GENDER_OPTIONS,
  MEMBER_MARITAL_STATUS_OPTIONS,
  MEMBER_STATUS_OPTIONS,
  type CreateMemberPayload,
  type MemberFormValues,
  type UpdateMemberPayload,
} from "@/modules/members/types/member";

interface MemberFormPageProps {
  mode: "create" | "edit";
  memberId?: string;
}

interface ChurchOption {
  id: string;
  name: string;
}

const initialFormValues: MemberFormValues = {
  fullName: "",
  birthDate: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  maritalStatus: "",
  joinedAt: "",
  status: "ACTIVE",
  notes: "",
  churchId: "",
};

const textareaClassName =
  "flex min-h-28 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function MemberFormPage({ mode, memberId }: MemberFormPageProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<MemberFormValues>(initialFormValues);
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
        const [churchesResponse, memberResponse] = await Promise.all([
          listChurches({ name: "", status: "" }),
          mode === "edit" && memberId ? getMemberById(memberId) : Promise.resolve(null),
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

        if (memberResponse) {
          setFormValues({
            fullName: memberResponse.fullName,
            birthDate: memberResponse.birthDate ?? "",
            gender: memberResponse.gender ?? "",
            phone: memberResponse.phone ?? "",
            email: memberResponse.email ?? "",
            address: memberResponse.address ?? "",
            maritalStatus: memberResponse.maritalStatus ?? "",
            joinedAt: memberResponse.joinedAt ?? "",
            status: memberResponse.status || "ACTIVE",
            notes: memberResponse.notes ?? "",
            churchId: memberResponse.churchId,
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
                : "Nao foi possivel carregar os dados do membro para edicao.",
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
  }, [mode, memberId]);

  function handleFieldChange(field: keyof MemberFormValues, value: string) {
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
        const payload: CreateMemberPayload = {
          fullName: formValues.fullName,
          birthDate: formValues.birthDate,
          gender: formValues.gender,
          phone: formValues.phone,
          email: formValues.email,
          address: formValues.address,
          maritalStatus: formValues.maritalStatus,
          joinedAt: formValues.joinedAt,
          status: formValues.status,
          notes: formValues.notes,
          churchId: formValues.churchId,
        };

        await createMember(payload);
      } else if (memberId) {
        const payload: UpdateMemberPayload = {
          fullName: formValues.fullName,
          birthDate: formValues.birthDate,
          gender: formValues.gender,
          phone: formValues.phone,
          email: formValues.email,
          address: formValues.address,
          maritalStatus: formValues.maritalStatus,
          joinedAt: formValues.joinedAt,
          status: formValues.status,
          notes: formValues.notes,
          churchId: formValues.churchId,
        };

        await updateMember(memberId, payload);
      }

      startTransition(() => {
        router.replace("/membros");
        router.refresh();
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Nao foi possivel criar o membro."
            : "Nao foi possivel salvar as alteracoes do membro.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <ErrorView
        title="Nao foi possivel abrir este membro"
        description={loadError}
        onAction={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Novo membro" : "Editar membro"}
        description={
          mode === "create"
            ? "Cadastre um novo membro com os dados principais vinculando-o a uma igreja."
            : "Atualize os dados do membro mantendo o mesmo padrao administrativo do sistema."
        }
        badge="Membros"
        action={
          <Button asChild variant="outline">
            <Link href="/membros">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Cadastro de membro" : "Edicao de membro"}
          </CardTitle>
          <CardDescription>
            Preencha os dados do membro e selecione a igreja vinculada para manter o cadastro organizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, index) => (
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
                  <Label htmlFor="member-fullName">Nome completo</Label>
                  <Input
                    id="member-fullName"
                    value={formValues.fullName}
                    onChange={(event) =>
                      handleFieldChange("fullName", event.target.value)
                    }
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-birthDate">Data de nascimento</Label>
                  <Input
                    id="member-birthDate"
                    type="date"
                    value={formValues.birthDate}
                    onChange={(event) =>
                      handleFieldChange("birthDate", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-gender">Genero</Label>
                  <Select
                    id="member-gender"
                    value={formValues.gender}
                    onChange={(event) =>
                      handleFieldChange("gender", event.target.value)
                    }
                  >
                    <option value="">Selecione o genero</option>
                    {MEMBER_GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-maritalStatus">Estado civil</Label>
                  <Select
                    id="member-maritalStatus"
                    value={formValues.maritalStatus}
                    onChange={(event) =>
                      handleFieldChange("maritalStatus", event.target.value)
                    }
                  >
                    <option value="">Selecione o estado civil</option>
                    {MEMBER_MARITAL_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-phone">Telefone</Label>
                  <Input
                    id="member-phone"
                    value={formValues.phone}
                    onChange={(event) =>
                      handleFieldChange("phone", event.target.value)
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-email">E-mail</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={formValues.email}
                    onChange={(event) =>
                      handleFieldChange("email", event.target.value)
                    }
                    placeholder="membro@igreja.org.br"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-joinedAt">Data de entrada</Label>
                  <Input
                    id="member-joinedAt"
                    type="date"
                    value={formValues.joinedAt}
                    onChange={(event) =>
                      handleFieldChange("joinedAt", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-status">Status</Label>
                  <Select
                    id="member-status"
                    value={formValues.status}
                    onChange={(event) =>
                      handleFieldChange("status", event.target.value)
                    }
                  >
                    {MEMBER_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="member-churchId">Igreja</Label>
                  <Select
                    id="member-churchId"
                    value={formValues.churchId}
                    onChange={(event) =>
                      handleFieldChange("churchId", event.target.value)
                    }
                    required
                  >
                    <option value="">Selecione uma igreja</option>
                    {churchOptions.map((church) => (
                      <option key={church.id} value={church.id}>
                        {church.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-address">Endereco</Label>
                <textarea
                  id="member-address"
                  className={textareaClassName}
                  value={formValues.address}
                  onChange={(event) =>
                    handleFieldChange("address", event.target.value)
                  }
                  placeholder="Endereco completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-notes">Observacoes</Label>
                <textarea
                  id="member-notes"
                  className={textareaClassName}
                  value={formValues.notes}
                  onChange={(event) =>
                    handleFieldChange("notes", event.target.value)
                  }
                  placeholder="Observacoes adicionais"
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
                  {mode === "create" ? "Criar membro" : "Salvar alteracoes"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/membros">Cancelar</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
