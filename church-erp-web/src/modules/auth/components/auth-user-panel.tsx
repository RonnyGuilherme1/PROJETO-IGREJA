"use client";

import { useTransition } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { getTenantLabel } from "@/lib/tenant-branding";
import { Button } from "@/components/ui/button";
import {
  clearAuthSession,
  getAuthLoginPath,
  getInitials,
} from "@/modules/auth/lib/auth-session";
import type { AuthUser } from "@/modules/auth/types/auth";

interface AuthUserPanelProps {
  user: AuthUser;
}

export function AuthUserPanel({ user }: AuthUserPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tenantLabel = getTenantLabel(user.tenantName, user.tenantCode);
  const accessScope =
    user.accessType === "PLATFORM"
      ? "Plataforma"
      : tenantLabel
        ? tenantLabel
        : null;
  const rawRole =
  user.platformRole ??
  user.role ??
  (user as { profile?: string }).profile ??
  "SEM_PERFIL";

  const roleLabel = rawRole
    .replace(/^PLATFORM_/i, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
  const details = [user.email || user.username, roleLabel, accessScope]
    .filter(Boolean)
    .join(" | ");

  function handleLogout() {
    clearAuthSession(user.accessType);
    startTransition(() => {
      router.replace(getAuthLoginPath(user.accessType));
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-2 py-2 shadow-xs sm:gap-3 sm:px-3">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
        {getInitials(user.name)}
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-semibold text-foreground">
          {user.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{details}</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isPending}
        className="rounded-xl px-2 sm:px-3"
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        <span className="hidden lg:inline">Sair</span>
      </Button>
    </div>
  );
}
