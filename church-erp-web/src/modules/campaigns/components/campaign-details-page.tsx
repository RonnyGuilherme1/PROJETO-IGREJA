"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Pencil,
  UserPlus,
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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

interface InstallmentActionState {
  action: "pay" | "unpay";
  installment: CampaignInstallmentItem;
  member: CampaignMemberItem;
}

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingInstallmentAction, setPendingInstallmentAction] =
    useState<InstallmentActionState | null>(null);

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

  async function confirmInstallmentAction() {
    if (!pendingInstallmentAction) {
      return;
    }

    const { action, installment } = pendingInstallmentAction;
    setActionError(null);
    setUpdatingInstallmentId(installment.id);

    try {
      if (action === "pay") {
        await markCampaignInstallmentPaid(installment.id);
      } else {
        await markCampaignInstallmentUnpaid(installment.id);
      }

      await loadCampaign();
      setPendingInstallmentAction(null);
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          action === "pay"
            ? "Nao foi possivel marcar a parcela como paga."
            : "Nao foi possivel marcar a parcela como nao paga.",
        ),
      );
    } finally {
      setUpdatingInstallmentId(null);
    }
  }

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

          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-secondary/60"
              />
            ))
          ) : campaign && campaign.members.length > 0 ? (
            campaign.members.map((member) => {
              const paidCount = member.installments.filter(
                (installment) => installment.status === "PAID",
              ).length;
              const unpaidCount = member.installments.length - paidCount;

              return (
                <div
                  key={member.id}
                  className="space-y-4 rounded-3xl border border-border bg-white p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">
                        {member.memberName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Vinculado em {formatDate(member.joinedAt)}
                      </p>
                      {member.notes ? (
                        <p className="text-sm text-muted-foreground">{member.notes}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Pagas: {paidCount}</Badge>
                      <Badge variant="outline">Em aberto: {unpaidCount}</Badge>
                    </div>
                  </div>

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
                            const rowLoading = updatingInstallmentId === installment.id;

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
                                    {getInstallmentStatusLabel(installment.status)}
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
                                            setPendingInstallmentAction({
                                              action: "unpay",
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
                                            setPendingInstallmentAction({
                                              action: "pay",
                                              installment,
                                              member,
                                            })
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
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-border bg-white px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhum membro vinculado a esta campanha ate o momento.
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(pendingInstallmentAction)}
        title={
          pendingInstallmentAction?.action === "pay"
            ? "Marcar parcela como paga"
            : "Marcar parcela como nao paga"
        }
        description={
          pendingInstallmentAction
            ? pendingInstallmentAction.action === "pay"
              ? `A parcela ${pendingInstallmentAction.installment.installmentNumber} de ${pendingInstallmentAction.member.memberName} sera registrada como paga.`
              : `A parcela ${pendingInstallmentAction.installment.installmentNumber} de ${pendingInstallmentAction.member.memberName} voltara para o status em aberto.`
            : ""
        }
        confirmLabel={
          pendingInstallmentAction?.action === "pay"
            ? "Confirmar pagamento"
            : "Desfazer pagamento"
        }
        confirmVariant={
          pendingInstallmentAction?.action === "pay" ? "default" : "destructive"
        }
        isLoading={Boolean(
          pendingInstallmentAction &&
            updatingInstallmentId === pendingInstallmentAction.installment.id,
        )}
        onConfirm={() => void confirmInstallmentAction()}
        onOpenChange={(open) => {
          if (!open) {
            setPendingInstallmentAction(null);
          }
        }}
      />
    </div>
  );
}
