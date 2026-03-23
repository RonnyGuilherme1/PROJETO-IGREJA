"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MEMBER_STATUS_OPTIONS, type MemberFilters } from "@/modules/members/types/member";

interface ChurchOption {
  id: string;
  name: string;
}

interface MembersFiltersProps {
  filters: MemberFilters;
  churchOptions: ChurchOption[];
  isLoading: boolean;
  onChange: (field: keyof MemberFilters, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export function MembersFilters({
  filters,
  churchOptions,
  isLoading,
  onChange,
  onSubmit,
  onReset,
}: MembersFiltersProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="filter-member-name">Nome</Label>
          <Input
            id="filter-member-name"
            placeholder="Buscar por nome"
            value={filters.name}
            onChange={(event) => onChange("name", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-member-status">Status</Label>
          <Select
            id="filter-member-status"
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            <option value="">Todos</option>
            {MEMBER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-member-church">Igreja</Label>
          <Select
            id="filter-member-church"
            value={filters.churchId}
            onChange={(event) => onChange("churchId", event.target.value)}
          >
            <option value="">Todas</option>
            {churchOptions.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
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
        <Button type="button" variant="outline" onClick={onReset} disabled={isLoading}>
          <X className="size-4" />
          Limpar filtros
        </Button>
      </div>
    </form>
  );
}
