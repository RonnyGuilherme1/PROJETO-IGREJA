"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/http";
import {
  createQueryKey,
  fetchCachedQuery,
  getCachedQuerySnapshot,
  invalidateQueryPrefix,
} from "@/lib/query/query-cache";
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
import { invalidateDashboardOverviewData } from "@/modules/dashboard/services/dashboard-service";
import { listChurches } from "@/modules/churches/services/churches-service";
import { MembersFilters } from "@/modules/members/components/members-filters";
import { MembersTable } from "@/modules/members/components/members-table";
import { getMembersAccessLabel } from "@/modules/members/lib/members-permissions";
import { inactivateMember, listMembers } from "@/modules/members/services/members-service";
import type { AuthUser } from "@/modules/auth/types/auth";
import type { ChurchFilters, ChurchListResult } from "@/modules/churches/types/church";
import type { MemberFilters, MemberItem } from "@/modules/members/types/member";
import type { MemberListResult } from "@/modules/members/types/member";

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
  ageRange: "",
  joinedFrom: "",
  joinedTo: "",
};

const feedbackMessages = {
  created: "Membro cadastrado com sucesso.",
  updated: "Membro atualizado com sucesso.",
  inactivated: "Membro inativado com sucesso.",
} as const;

const MEMBERS_LIST_QUERY_PREFIX = "members:list";
const CHURCHES_LIST_QUERY_PREFIX = "churches:list";
const MEMBERS_LIST_TTL_MS = 30_000;
const CHURCH_OPTIONS_TTL_MS = 5 * 60_000;
const churchLookupFilters: ChurchFilters = {
  name: "",
  status: "",
};

function getMembersListQueryKey(filters: MemberFilters) {
  return createQueryKey(MEMBERS_LIST_QUERY_PREFIX, {
    name: filters.name.trim(),
    status: filters.status,
    churchId: filters.churchId,
    ageRange: filters.ageRange,
    joinedFrom: filters.joinedFrom,
    joinedTo: filters.joinedTo,
  });
}

function getChurchOptionsQueryKey() {
  return createQueryKey(CHURCHES_LIST_QUERY_PREFIX, churchLookupFilters);
}

function buildChurchOptions(churches?: ChurchListResult): ChurchOption[] {
  return (churches?.items ?? []).map((church) => ({
    id: church.id,
    name: church.name,
  }));
}

export function MembersListPage({
  canEdit,
  currentUser,
}: MembersListPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feedbackKey = searchParams.get("feedback");
  const hasNavigationFeedback = Boolean(
    feedbackKey &&
      Object.prototype.hasOwnProperty.call(feedbackMessages, feedbackKey),
  );
  const [filters, setFilters] = useState<MemberFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<MemberFilters>(initialFilters);
  const [members, setMembers] = useState<MemberItem[]>(
    () =>
      getCachedQuerySnapshot<MemberListResult>(
        getMembersListQueryKey(initialFilters),
      ).data?.items ?? [],
  );
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>(
    () =>
      buildChurchOptions(
        getCachedQuerySnapshot<ChurchListResult>(getChurchOptionsQueryKey()).data,
      ),
  );
  const [total, setTotal] = useState(
    () =>
      getCachedQuerySnapshot<MemberListResult>(
        getMembersListQueryKey(initialFilters),
      ).data?.total ?? 0,
  );
  const [isLoading, setIsLoading] = useState(
    () =>
      !getCachedQuerySnapshot<MemberListResult>(
        getMembersListQueryKey(initialFilters),
      ).data,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [churchesError, setChurchesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [memberPendingInactivation, setMemberPendingInactivation] =
    useState<MemberItem | null>(null);
  const churchNamesById = Object.fromEntries(
    churchOptions.map((church) => [church.id, church.name]),
  );

  const loadMembers = useCallback(
    async (currentFilters: MemberFilters, options?: { force?: boolean }) => {
      if (options?.force) {
        invalidateQueryPrefix(MEMBERS_LIST_QUERY_PREFIX);
        invalidateDashboardOverviewData();
      }

      const queryKey = getMembersListQueryKey(currentFilters);
      const snapshot = getCachedQuerySnapshot<MemberListResult>(queryKey);

      if (snapshot.data) {
        setMembers(snapshot.data.items);
        setTotal(snapshot.data.total);
      }

      if (snapshot.isFresh && !options?.force) {
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchCachedQuery(queryKey, () => listMembers(currentFilters), {
          ttlMs: MEMBERS_LIST_TTL_MS,
          force: options?.force,
        });

        setMembers(response.items);
        setTotal(response.total);
      } catch (loadError) {
        setError(
          getApiErrorMessage(loadError, "Nao foi possivel carregar os membros."),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const loadChurchOptions = useCallback(async () => {
    const queryKey = getChurchOptionsQueryKey();
    const snapshot = getCachedQuerySnapshot<ChurchListResult>(queryKey);

    if (snapshot.data) {
      setChurchOptions(buildChurchOptions(snapshot.data));
      setChurchesError(null);
    }

    if (snapshot.isFresh) {
      return;
    }

    try {
      const response = await fetchCachedQuery(queryKey, () => listChurches(churchLookupFilters), {
        ttlMs: CHURCH_OPTIONS_TTL_MS,
      });

      setChurchOptions(buildChurchOptions(response));
      setChurchesError(null);
    } catch (loadError) {
      setChurchesError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar as igrejas para os filtros.",
        ),
      );
    }
  }, []);

  useEffect(() => {
    void loadMembers(appliedFilters, { force: hasNavigationFeedback });
  }, [appliedFilters, hasNavigationFeedback, loadMembers]);

  useEffect(() => {
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
  }, [feedbackKey, pathname, router, searchParams]);

  useEffect(() => {
    void loadChurchOptions();
  }, [loadChurchOptions]);

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
      await loadMembers(appliedFilters, { force: true });
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
        onAction={() => void loadMembers(appliedFilters, { force: true })}
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
              onAction={() => void loadMembers(appliedFilters, { force: true })}
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
