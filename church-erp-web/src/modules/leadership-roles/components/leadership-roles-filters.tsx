"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  LEADERSHIP_ROLE_STATUS_OPTIONS,
  type LeadershipRoleFilters,
} from "@/modules/leadership-roles/types/leadership-role";

interface LeadershipRolesFiltersProps {
  filters: LeadershipRoleFilters;
  isLoading: boolean;
  onChange: (field: keyof LeadershipRoleFilters, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export function LeadershipRolesFilters({
  filters,
  isLoading,
  onChange,
  onSubmit,
  onReset,
}: LeadershipRolesFiltersProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="filter-leadership-role-name">Nome</Label>
          <Input
            id="filter-leadership-role-name"
            placeholder="Buscar por nome ou descricao"
            value={filters.name}
            onChange={(event) => onChange("name", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-leadership-role-status">Status</Label>
          <Select
            id="filter-leadership-role-status"
            value={filters.active}
            onChange={(event) => onChange("active", event.target.value)}
          >
            <option value="">Todos</option>
            {LEADERSHIP_ROLE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={isLoading}>
          <Search className="size-4" />
          Filtrar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={isLoading}
        >
          <X className="size-4" />
          Limpar filtros
        </Button>
      </div>
    </form>
  );
}
