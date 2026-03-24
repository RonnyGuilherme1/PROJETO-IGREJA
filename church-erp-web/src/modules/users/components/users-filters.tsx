"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  type UserFilters,
} from "@/modules/users/types/user";

interface UsersFiltersProps {
  filters: UserFilters;
  isLoading: boolean;
  onChange: (field: keyof UserFilters, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export function UsersFilters({
  filters,
  isLoading,
  onChange,
  onSubmit,
  onReset,
}: UsersFiltersProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="filter-name">Nome</Label>
          <Input
            id="filter-name"
            placeholder="Buscar por nome"
            value={filters.name}
            onChange={(event) => onChange("name", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-email">E-mail</Label>
          <Input
            id="filter-email"
            type="email"
            placeholder="Buscar por e-mail"
            value={filters.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            id="filter-status"
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            <option value="">Todos</option>
            {USER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-role">Perfil</Label>
          <Select
            id="filter-role"
            value={filters.role}
            onChange={(event) => onChange("role", event.target.value)}
          >
            <option value="">Todos</option>
            {USER_ROLE_OPTIONS.map((option) => (
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
        <Button type="button" variant="outline" onClick={onReset} disabled={isLoading}>
          <X className="size-4" />
          Limpar filtros
        </Button>
      </div>
    </form>
  );
}
