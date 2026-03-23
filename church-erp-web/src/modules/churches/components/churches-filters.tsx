"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CHURCH_STATUS_OPTIONS,
  type ChurchFilters,
} from "@/modules/churches/types/church";

interface ChurchesFiltersProps {
  filters: ChurchFilters;
  isLoading: boolean;
  onChange: (field: keyof ChurchFilters, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export function ChurchesFilters({
  filters,
  isLoading,
  onChange,
  onSubmit,
  onReset,
}: ChurchesFiltersProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="filter-church-name">Nome</Label>
          <Input
            id="filter-church-name"
            placeholder="Buscar por nome"
            value={filters.name}
            onChange={(event) => onChange("name", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-church-status">Status</Label>
          <Select
            id="filter-church-status"
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            <option value="">Todos</option>
            {CHURCH_STATUS_OPTIONS.map((option) => (
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
