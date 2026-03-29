"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ImageOff,
  LoaderCircle,
  Pencil,
  Search,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { ErrorView } from "@/components/shared/error-view";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
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
import { normalizeTenantLogoUrl } from "@/lib/tenant-branding";
import {
  addCampaignMember,
  getCampaignById,
  markCampaignInstallmentPaid,
  markCampaignInstallmentUnpaid,
} from "@/modules/campaigns/services/campaigns-service";
import type {
  CampaignDetailItem,
  CampaignInstallmentItem,
  CampaignMemberItem,
} from "@/modules/campaigns/types/campaign";
import { listMembers } from "@/modules/members/services/members-service";
import type { MemberItem } from "@/modules/members/types/member";

interface CampaignDetailsPageProps {
  campaignId: string;
  canEdit: boolean;
}

interface InstallmentSelectionState {
  installment: CampaignInstallmentItem;
  member: CampaignMemberItem;
}

interface MarkPaidFormValues {
  paidAt: string;
  notes: string;
}

const textareaClassName =
  "flex min-h-28 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function formatCurrency(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function formatDateInput(value: string | null) {
  if (!value) {
    return "";
  }

  return value.includes("T") ? value.slice(0, 10) : value;
}

function getTodayDateInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

  return today.toISOString().slice(0, 10);
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getInstallmentCounts(installments: CampaignInstallmentItem[]) {
  return installments.reduce(
    (counts, installment) => {
      if (installment.status === "PAID") {
        counts.paid += 1;
      } else {
        counts.unpaid += 1;
      }

      return counts;
    },
    { paid: 0, unpaid: 0 },
  );
}

function getCampaignStatusLabel(status: CampaignDetailItem["status"]) {
  return status === "CLOSED" ? "Encerrada" : "Ativa";
}

function getInstallmentStatusLabel(status: CampaignInstallmentItem["status"]) {
  return status === "PAID" ? "Paga" : "Em aberto";
}

export function CampaignDetailsPage({
  campaignId,
  canEdit,
}: CampaignDetailsPageProps) {
  const [campaign, setCampaign] = useState<CampaignDetailItem | null>(null);
  const [availableMembers, setAvailableMembers] = useState<MemberItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [updatingInstallmentId, setUpdatingInstallmentId] = useState<string | null>(
    null,
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>(
    {},
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [failedCampaignImageUrl, setFailedCampaignImageUrl] = useState<string | null>(
    null,
  );
  const [markPaidFormError, setMarkPaidFormError] = useState<string | null>(null);
  const [markPaidFormValues, setMarkPaidFormValues] = useState<MarkPaidFormValues>({
    paidAt: getTodayDateInputValue(),
    notes: "",
  });
  const [pendingPaidInstallment, setPendingPaidInstallment] =
    useState<InstallmentSelectionState | null>(null);
  const [pendingUnpayInstallment, setPendingUnpayInstallment] =
    useState<InstallmentSelectionState | null>(null);

  const loadCampaign = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const campaignResponse = await getCampaignById(campaignId);
      setCampaign(campaignResponse);
    } catch (error) {
      setLoadError(
        getApiErrorMessage(
          error,
          "Nao foi possivel carregar os detalhes da campanha.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void loadCampaign();
  }, [loadCampaign]);

  useEffect(() => {
    if (!campaign || !canEdit) {
      setAvailableMembers([]);
      setSelectedMemberId("");
      return;
    }

    const currentCampaign = campaign;
    let isActive = true;

    async function loadAvailableMembers() {
      try {
        const response = await listMembers({
          name: "",
          status: "",
          churchId: currentCampaign.churchId,
          leadershipRoleId: "",
          departmentId: "",
        });

        if (!isActive) {
          return;
        }

        const linkedMemberIds = new Set(
          currentCampaign.members.map((member) => member.memberId),
        );
        const nextAvailableMembers = response.items.filter(
          (member) => !linkedMemberIds.has(member.id),
        );

        setAvailableMembers(nextAvailableMembers);
        setReferenceDataError(null);
        setSelectedMemberId((currentSelectedMemberId) =>
          nextAvailableMembers.some((member) => member.id === currentSelectedMemberId)
            ? currentSelectedMemberId
            : nextAvailableMembers[0]?.id ?? "",
        );
      } catch (error) {
        if (isActive) {
          setReferenceDataError(
            getApiErrorMessage(
              error,
              "Nao foi possivel carregar os membros disponiveis para vinculacao.",
            ),
          );
          setAvailableMembers([]);
          setSelectedMemberId("");
        }
      }
    }

    void loadAvailableMembers();

    return () => {
      isActive = false;
    };
  }, [campaign, canEdit]);

  useEffect(() => {
    if (!campaign) {
      setExpandedMembers({});
      return;
    }

    setExpandedMembers((currentExpandedMembers) => {
      const nextExpandedMembers: Record<string, boolean> = {};

      campaign.members.forEach((member) => {
        nextExpandedMembers[member.id] = currentExpandedMembers[member.id] ?? false;
      });

      return nextExpandedMembers;
    });
  }, [campaign]);

  const installmentTotals = useMemo(() => {
    if (!campaign) {
      return {
        paid: 0,
        unpaid: 0,
      };
    }

    return campaign.members.reduce(
      (totals, member) => {
        member.installments.forEach((installment) => {
          if (installment.status === "PAID") {
            totals.paid += 1;
          } else {
            totals.unpaid += 1;
          }
        });

        return totals;
      },
      { paid: 0, unpaid: 0 },
    );
  }, [campaign]);
  const resolvedCampaignImageUrl =
    normalizeTenantLogoUrl(campaign?.imageUrl, {
      resolveRelative: true,
    }) ?? "";
  const hasCampaignImage =
    Boolean(resolvedCampaignImageUrl) &&
    resolvedCampaignImageUrl !== failedCampaignImageUrl;

  const filteredMembers = useMemo(() => {
    if (!campaign) {
      return [];
    }

    const normalizedMemberSearch = normalizeSearchValue(memberSearch);

    if (!normalizedMemberSearch) {
      return campaign.members;
    }

    return campaign.members.filter((member) =>
      normalizeSearchValue(member.memberName).includes(normalizedMemberSearch),
    );
  }, [campaign, memberSearch]);

  const hasVisibleMembers = filteredMembers.length > 0;
  const areAllVisibleMembersExpanded =
    hasVisibleMembers &&
    filteredMembers.every((member) => expandedMembers[member.id] ?? false);
  const hasExpandedVisibleMembers = filteredMembers.some(
    (member) => expandedMembers[member.id] ?? false,
  );

  function toggleMemberExpansion(memberId: string) {
    setExpandedMembers((currentExpandedMembers) => ({
      ...currentExpandedMembers,
      [memberId]: !(currentExpandedMembers[memberId] ?? false),
    }));
  }

  function expandVisibleMembers() {
    setExpandedMembers((currentExpandedMembers) => {
      const nextExpandedMembers = { ...currentExpandedMembers };

      filteredMembers.forEach((member) => {
        nextExpandedMembers[member.id] = true;
      });

      return nextExpandedMembers;
    });
  }

  function collapseVisibleMembers() {
    setExpandedMembers((currentExpandedMembers) => {
      const nextExpandedMembers = { ...currentExpandedMembers };

      filteredMembers.forEach((member) => {
        nextExpandedMembers[member.id] = false;
      });

      return nextExpandedMembers;
    });
  }

  function resetMarkPaidForm() {
    setMarkPaidFormValues({
      paidAt: getTodayDateInputValue(),
      notes: "",
    });
    setMarkPaidFormError(null);
  }

  function handleMarkPaidDialogOpenChange(open: boolean) {
    if (!open) {
      setPendingPaidInstallment(null);
      resetMarkPaidForm();
    }
  }

  function openMarkPaidDialog(member: CampaignMemberItem, installment: CampaignInstallmentItem) {
    setActionError(null);
    setMarkPaidFormError(null);
    setMarkPaidFormValues({
      paidAt: formatDateInput(installment.paidAt) || getTodayDateInputValue(),
      notes: installment.notes ?? "",
    });
    setPendingPaidInstallment({
      installment,
      member,
    });
  }

  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!campaign || !selectedMemberId) {
      return;
    }

    setActionError(null);
    setIsAddingMember(true);

    try {
      await addCampaignMember(campaign.id, {
        memberId: selectedMemberId,
      });
      await loadCampaign();
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          "Nao foi possivel vincular o membro a campanha.",
        ),
      );
    } finally {
      setIsAddingMember(false);
    }
  }

  async function handleMarkPaidSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pendingPaidInstallment) {
      return;
    }

    const paidAt = markPaidFormValues.paidAt.trim();

    if (!paidAt) {
      setMarkPaidFormError("Informe a data do pagamento.");
      return;
    }

    const normalizedNotes = markPaidFormValues.notes.trim();
    const { installment } = pendingPaidInstallment;
    setActionError(null);
    setMarkPaidFormError(null);
    setUpdatingInstallmentId(installment.id);

    try {
      await markCampaignInstallmentPaid(installment.id, {
        paidAt,
        notes: normalizedNotes || undefined,
      });
      await loadCampaign();
      handleMarkPaidDialogOpenChange(false);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Nao foi possivel marcar a parcela como paga.",
      );

      setActionError(message);
      setMarkPaidFormError(message);
    } finally {
      setUpdatingInstallmentId(null);
    }
  }

  async function confirmUnpayInstallment() {
    if (!pendingUnpayInstallment) {
      return;
    }

    const { installment } = pendingUnpayInstallment;
    setActionError(null);
    setUpdatingInstallmentId(installment.id);

    try {
      await markCampaignInstallmentUnpaid(installment.id);
      await loadCampaign();
      setPendingUnpayInstallment(null);
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          "Nao foi possivel marcar a parcela como nao paga.",
        ),
      );
    } finally {
      setUpdatingInstallmentId(null);
    }
  }

  const isSubmittingPaidInstallment = Boolean(
    pendingPaidInstallment &&
      updatingInstallmentId === pendingPaidInstallment.installment.id,
  );

  if (loadError) {
    return (
      <ErrorView
        title="Nao foi possivel abrir esta campanha"
        description={loadError}
        onAction={() => void loadCampaign()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign?.title || "Campanha"}
        description="Acompanhe membros vinculados, parcelas geradas e o status de pagamento por participante."
        badge={canEdit ? "Gerenciamento" : "Consulta"}
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/campanhas">
                <ArrowLeft className="size-4" />
                Voltar
              </Link>
            </Button>
            {canEdit && campaign ? (
              <Button asChild variant="outline">
                <Link href={`/avisos/novo?campaignId=${campaign.id}`}>
                  Criar aviso desta campanha
                </Link>
              </Button>
            ) : null}
            {canEdit && campaign ? (
              <Button asChild>
                <Link href={`/campanhas/${campaign.id}/editar`}>
                  <Pencil className="size-4" />
                  Editar campanha
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {isLoading || resolvedCampaignImageUrl ? (
        <Card className="overflow-hidden bg-white/85">
          <CardHeader className="space-y-2">
            <CardTitle>Banner da campanha</CardTitle>
            <CardDescription>
              Visualize a imagem principal configurada para esta campanha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 animate-pulse rounded-3xl bg-secondary/60" />
            ) : hasCampaignImage ? (
              <div className="overflow-hidden rounded-3xl border border-border bg-white">
                <img
                  src={resolvedCampaignImageUrl}
                  alt={campaign?.title || "Banner da campanha"}
                  className="h-64 w-full object-cover"
                  onError={() => setFailedCampaignImageUrl(resolvedCampaignImageUrl)}
                />
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-secondary/15 text-muted-foreground">
                <ImageOff className="size-8" />
                <p className="text-sm">
                  Nao foi possivel carregar o banner desta campanha.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-white/85">
                <CardContent className="p-6">
                  <div className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
                </CardContent>
              </Card>
            ))
          : (
              <>
                <Card className="bg-white/85">
                  <CardHeader className="space-y-1">
                    <CardDescription>Status</CardDescription>
                    <CardTitle className="flex items-center gap-3">
                      <Badge
                        variant={
                          campaign?.status === "CLOSED" ? "outline" : "secondary"
                        }
                      >
                        {campaign ? getCampaignStatusLabel(campaign.status) : "-"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-white/85">
                  <CardHeader className="space-y-1">
                    <CardDescription>Igreja</CardDescription>
                    <CardTitle>{campaign?.churchName || "-"}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-white/85">
                  <CardHeader className="space-y-1">
                    <CardDescription>Estrutura</CardDescription>
                    <CardTitle>
                      {campaign?.installmentCount || 0}x de{" "}
                      {campaign ? formatCurrency(campaign.installmentAmount) : "-"}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-white/85">
                  <CardHeader className="space-y-1">
                    <CardDescription>Membros</CardDescription>
                    <CardTitle>{campaign?.membersCount || 0}</CardTitle>
                  </CardHeader>
                </Card>
              </>
            )}
      </div>

      <Card className="bg-white/85">
        <CardHeader className="space-y-2">
          <CardTitle>Resumo da campanha</CardTitle>
          <CardDescription>
            Consulte a descricao, a data inicial e o panorama geral das parcelas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl bg-secondary/60"
              />
            ))
          ) : (
            <>
              <div className="space-y-2 rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Data inicial
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(campaign?.startDate ?? null)}
                </p>
              </div>
              <div className="space-y-2 rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Parcelas pagas
                </p>
                <p className="text-sm font-medium text-foreground">
                  {installmentTotals.paid}
                </p>
              </div>
              <div className="space-y-2 rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Parcelas em aberto
                </p>
                <p className="text-sm font-medium text-foreground">
                  {installmentTotals.unpaid}
                </p>
              </div>
              <div className="space-y-2 rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Descricao
                </p>
                <p className="text-sm text-muted-foreground">
                  {campaign?.description || "Sem descricao informada para esta campanha."}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <Card className="bg-white/85">
          <CardHeader className="space-y-2">
            <CardTitle>Vincular membros</CardTitle>
            <CardDescription>
              Adicione membros da mesma igreja para gerar automaticamente as parcelas da campanha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {referenceDataError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {referenceDataError}
              </div>
            ) : null}

            {campaign?.status === "CLOSED" ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
                A campanha esta encerrada. Novos membros nao podem ser vinculados.
              </div>
            ) : availableMembers.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
                Nenhum membro disponivel para vinculacao nesta igreja.
              </div>
            ) : (
              <form
                onSubmit={handleAddMember}
                className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="space-y-2">
                  <Label htmlFor="campaign-member">Membro</Label>
                  <Select
                    id="campaign-member"
                    value={selectedMemberId}
                    onChange={(event) => setSelectedMemberId(event.target.value)}
                    disabled={isAddingMember}
                  >
                    <option value="">Selecione um membro</option>
                    {availableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName}
                        {member.leadershipRoleName ? ` - ${member.leadershipRoleName}` : ""}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={isAddingMember || !selectedMemberId}
                  >
                    {isAddingMember ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <UserPlus className="size-4" />
                    )}
                    Vincular membro
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-white/85">
        <CardHeader className="space-y-2">
          <CardTitle>Parcelas por membro</CardTitle>
          <CardDescription>
            Consulte o historico dos participantes e atualize a situacao de cada parcela quando necessario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {actionError}
            </div>
          ) : null}

          <div className="grid gap-4 rounded-3xl border border-border/70 bg-secondary/15 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="campaign-member-search">Buscar membro</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="campaign-member-search"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Digite o nome do membro"
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={expandVisibleMembers}
                disabled={isLoading || !hasVisibleMembers || areAllVisibleMembersExpanded}
              >
                <ChevronDown className="size-4" />
                Expandir todos
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={collapseVisibleMembers}
                disabled={isLoading || !hasExpandedVisibleMembers}
              >
                <ChevronUp className="size-4" />
                Recolher todos
              </Button>
            </div>
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-secondary/60"
              />
            ))
          ) : campaign && campaign.members.length > 0 ? (
            filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const { paid: paidCount, unpaid: unpaidCount } =
                  getInstallmentCounts(member.installments);
                const isExpanded = expandedMembers[member.id] ?? false;

                return (
                  <div
                    key={member.id}
                    className="space-y-4 rounded-3xl border border-border bg-white p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-foreground">
                          {member.memberName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Vinculado em {formatDate(member.joinedAt)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">Pagas: {paidCount}</Badge>
                          <Badge variant="outline">Em aberto: {unpaidCount}</Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMemberExpansion(member.id)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                          {isExpanded ? "Recolher" : "Expandir"}
                        </Button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <>
                        {member.notes ? (
                          <div className="rounded-2xl border border-border bg-secondary/10 px-4 py-3 text-sm text-muted-foreground">
                            {member.notes}
                          </div>
                        ) : null}

                        <div className="overflow-hidden rounded-3xl border border-border">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                              <thead className="bg-secondary/35">
                                <tr className="text-left">
                                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Parcela
                                  </th>
                                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Vencimento
                                  </th>
                                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Valor
                                  </th>
                                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Status
                                  </th>
                                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Pago em
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Acoes
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {member.installments.map((installment) => {
                                  const rowLoading =
                                    updatingInstallmentId === installment.id;

                                  return (
                                    <tr key={installment.id} className="align-top">
                                      <td className="px-4 py-4 text-sm font-medium text-foreground">
                                        {installment.installmentNumber}
                                      </td>
                                      <td className="px-4 py-4 text-sm text-muted-foreground">
                                        {formatDate(installment.dueDate)}
                                      </td>
                                      <td className="px-4 py-4 text-sm text-muted-foreground">
                                        {formatCurrency(installment.amount)}
                                      </td>
                                      <td className="px-4 py-4">
                                        <Badge
                                          variant={
                                            installment.status === "PAID"
                                              ? "secondary"
                                              : "outline"
                                          }
                                        >
                                          {getInstallmentStatusLabel(
                                            installment.status,
                                          )}
                                        </Badge>
                                        {installment.notes ? (
                                          <p className="mt-2 max-w-xs text-xs text-muted-foreground">
                                            {installment.notes}
                                          </p>
                                        ) : null}
                                      </td>
                                      <td className="px-4 py-4 text-sm text-muted-foreground">
                                        {formatDate(installment.paidAt)}
                                      </td>
                                      <td className="px-4 py-4">
                                        {canEdit ? (
                                          <div className="flex justify-end">
                                            {installment.status === "PAID" ? (
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  setPendingUnpayInstallment({
                                                    installment,
                                                    member,
                                                  })
                                                }
                                                disabled={rowLoading}
                                              >
                                                {rowLoading ? (
                                                  <LoaderCircle className="size-4 animate-spin" />
                                                ) : (
                                                  <XCircle className="size-4" />
                                                )}
                                                Marcar nao paga
                                              </Button>
                                            ) : (
                                              <Button
                                                type="button"
                                                size="sm"
                                                onClick={() =>
                                                  openMarkPaidDialog(member, installment)
                                                }
                                                disabled={rowLoading}
                                              >
                                                {rowLoading ? (
                                                  <LoaderCircle className="size-4 animate-spin" />
                                                ) : (
                                                  <CheckCircle2 className="size-4" />
                                                )}
                                                Marcar paga
                                              </Button>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-sm text-muted-foreground">
                                            Somente consulta
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-border bg-white px-4 py-12 text-center text-sm text-muted-foreground">
                Nenhum membro encontrado para a busca informada.
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-border bg-white px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhum membro vinculado a esta campanha ate o momento.
            </div>
          )}
        </CardContent>
      </Card>

      <DialogPrimitive.Root
        open={Boolean(pendingPaidInstallment)}
        onOpenChange={handleMarkPaidDialogOpenChange}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />

          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] border bg-card p-6 shadow-2xl duration-200 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100">
            <button
              type="button"
              className="absolute right-4 top-4 rounded-md p-1 text-current opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-40"
              onClick={() => handleMarkPaidDialogOpenChange(false)}
              disabled={isSubmittingPaidInstallment}
            >
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </button>

            <form onSubmit={handleMarkPaidSubmit} className="space-y-5">
              <div className="space-y-2">
                <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                  Marcar parcela como paga
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm leading-6 text-muted-foreground">
                  {pendingPaidInstallment
                    ? `Informe a data do pagamento da parcela ${pendingPaidInstallment.installment.installmentNumber} de ${pendingPaidInstallment.member.memberName}.`
                    : ""}
                </DialogPrimitive.Description>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campaign-installment-paid-at">Data do pagamento</Label>
                  <Input
                    id="campaign-installment-paid-at"
                    type="date"
                    value={markPaidFormValues.paidAt}
                    onChange={(event) =>
                      setMarkPaidFormValues((currentValues) => ({
                        ...currentValues,
                        paidAt: event.target.value,
                      }))
                    }
                    disabled={isSubmittingPaidInstallment}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-installment-notes">Observacao</Label>
                <textarea
                  id="campaign-installment-notes"
                  value={markPaidFormValues.notes}
                  onChange={(event) =>
                    setMarkPaidFormValues((currentValues) => ({
                      ...currentValues,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Adicione uma observacao, se necessario"
                  className={textareaClassName}
                  disabled={isSubmittingPaidInstallment}
                />
              </div>

              {markPaidFormError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {markPaidFormError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleMarkPaidDialogOpenChange(false)}
                  disabled={isSubmittingPaidInstallment}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmittingPaidInstallment}>
                  {isSubmittingPaidInstallment ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Confirmar pagamento
                </Button>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <ConfirmActionDialog
        open={Boolean(pendingUnpayInstallment)}
        title="Marcar parcela como nao paga"
        description={
          pendingUnpayInstallment
            ? `A parcela ${pendingUnpayInstallment.installment.installmentNumber} de ${pendingUnpayInstallment.member.memberName} voltara para o status em aberto.`
            : ""
        }
        confirmLabel="Desfazer pagamento"
        confirmVariant="destructive"
        isLoading={Boolean(
          pendingUnpayInstallment &&
            updatingInstallmentId === pendingUnpayInstallment.installment.id,
        )}
        onConfirm={() => void confirmUnpayInstallment()}
        onOpenChange={(open) => {
          if (!open) {
            setPendingUnpayInstallment(null);
          }
        }}
      />
    </div>
  );
}
