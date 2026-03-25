"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { ErrorView } from "@/components/shared/error-view";
import { PageLoading } from "@/components/shared/page-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listChurches } from "@/modules/churches/services/churches-service";
import { MembersFilters } from "@/modules/members/components/members-filters";
import { MembersTable } from "@/modules/members/components/members-table";
import { getMembersAccessLabel } from "@/modules/members/lib/members-permissions";
import { inactivateMember, listMembers } from "@/modules/members/services/members-service";
import type { AuthUser } from "@/modules/auth/types/auth";
import type { MemberFilters, MemberItem } from "@/modules/members/types/member";

interface MembersListPageProps {
  canEdit: boolean;
  currentUser?: AuthUser | null;
}

interface ChurchOption {
  id: string;
  name: string;
}

const initialFilters: MemberFilters = {
  name: "",
  status: "",
  churchId: "",
};

const feedbackMessages = {
  created: "Membro cadastrado com sucesso.",
  updated: "Membro atualizado com sucesso.",
  inactivated: "Membro inativado com sucesso.",
} as const;

export function MembersListPage({
  canEdit,
  currentUser,
}: MembersListPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<MemberFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<MemberFilters>(initialFilters);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [churchesError, setChurchesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [memberPendingInactivation, setMemberPendingInactivation] =
    useState<MemberItem | null>(null);
  const churchNamesById = Object.fromEntries(
    churchOptions.map((church) => [church.id, church.name]),
  );

  const loadMembers = useCallback(async (currentFilters: MemberFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listMembers(currentFilters);
      setMembers(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(loadError, "Nao foi possivel carregar os membros."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers(appliedFilters);
  }, [appliedFilters, loadMembers]);

  useEffect(() => {
    const feedbackKey = searchParams.get("feedback");

    if (!feedbackKey || !(feedbackKey in feedbackMessages)) {
      return;
    }

    setFeedback(feedbackMessages[feedbackKey as keyof typeof feedbackMessages]);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("feedback");
    router.replace(
      nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname,
      { scroll: false },
    );
  }, [pathname, router, searchParams]);

  useEffect(() => {
    let isActive = true;

    async function loadChurchOptions() {
      try {
        const response = await listChurches({ name: "", status: "" });

        if (!isActive) {
          return;
        }

        setChurchOptions(
          response.items.map((church) => ({
            id: church.id,
            name: church.name,
          })),
        );
      } catch (loadError) {
        if (isActive) {
          setChurchesError(
            getApiErrorMessage(
              loadError,
              "Nao foi possivel carregar as igrejas para os filtros.",
            ),
          );
        }
      }
    }

    void loadChurchOptions();

    return () => {
      isActive = false;
    };
  }, []);

  function handleFilterChange(field: keyof MemberFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }

  async function handleInactivate(member: MemberItem) {
    setMemberPendingInactivation(member);
  }

  async function confirmInactivateMember() {
    if (!memberPendingInactivation) {
      return;
    }

    setInactivatingId(memberPendingInactivation.id);
    setError(null);
    setFeedback(null);

    try {
      await inactivateMember(memberPendingInactivation.id);
      await loadMembers(appliedFilters);
      setMemberPendingInactivation(null);
      setFeedback(feedbackMessages.inactivated);
    } catch (actionError) {
      setError(
        getApiErrorMessage(actionError, "Nao foi possivel inativar o membro."),
      );
    } finally {
      setInactivatingId(null);
    }
  }

  if (error && members.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel carregar os membros"
        description={error}
        onAction={() => void loadMembers(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Membros
          </h1>
          <Badge variant="secondary">{getMembersAccessLabel(currentUser)}</Badge>
        </div>
        {canEdit ? (
          <Button asChild>
            <Link href="/membros/novo">
              <Plus className="size-4" />
              Novo membro
            </Link>
          </Button>
        ) : null}
      </div>

      <Card className="bg-white/85">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
          <CardTitle>Filtros</CardTitle>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {churchesError ? (
            <ErrorView
              variant="inline"
              title="Igrejas indisponiveis"
              description={churchesError}
            />
          ) : null}

          <MembersFilters
            filters={filters}
            churchOptions={churchOptions}
            isLoading={isLoading}
            onChange={handleFilterChange}
            onSubmit={handleFilterSubmit}
            onReset={handleResetFilters}
          />
        </CardContent>
      </Card>

      <Card className="bg-white/85">
        <CardHeader className="pb-4">
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {feedback}
            </div>
          ) : null}

          {error ? (
            <ErrorView
              variant="inline"
              title="Nao foi possivel atualizar a listagem"
              description={error}
              actionLabel="Recarregar listagem"
              onAction={() => void loadMembers(appliedFilters)}
            />
          ) : null}

          {isLoading && members.length === 0 ? (
            <PageLoading variant="list" />
          ) : (
            <MembersTable
              members={members}
              churchNamesById={churchNamesById}
              isLoading={isLoading}
              canEdit={canEdit}
              inactivatingId={inactivatingId}
              onInactivate={handleInactivate}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(memberPendingInactivation)}
        title="Inativar membro"
        description={
          memberPendingInactivation
            ? `${memberPendingInactivation.fullName} sera inativado e continuara disponivel no historico.`
            : ""
        }
        confirmLabel="Inativar"
        cancelLabel="Voltar"
        confirmVariant="destructive"
        isLoading={Boolean(
          memberPendingInactivation &&
            inactivatingId === memberPendingInactivation.id,
        )}
        onConfirm={() => void confirmInactivateMember()}
        onOpenChange={(open) => {
          if (!open) {
            setMemberPendingInactivation(null);
          }
        }}
      />
    </div>
  );
}
