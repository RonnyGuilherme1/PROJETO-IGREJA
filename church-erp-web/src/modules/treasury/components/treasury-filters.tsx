"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  TREASURY_STATUS_OPTIONS,
  TREASURY_TYPE_OPTIONS,
  type TreasuryCategoryItem,
  type TreasuryFilters,
} from "@/modules/treasury/types/treasury";

interface ChurchOption {
  id: string;
  name: string;
}

interface TreasuryFiltersProps {
  filters: TreasuryFilters;
  categories: TreasuryCategoryItem[];
  churches: ChurchOption[];
  isLoading: boolean;
  onChange: (field: keyof TreasuryFilters, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export function TreasuryFilters({
  filters,
  categories,
  churches,
  isLoading,
  onChange,
  onSubmit,
  onReset,
}: TreasuryFiltersProps) {
  const filteredCategories = filters.type
    ? categories.filter((category) => category.type === filters.type)
    : categories;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="treasury-startDate">Data inicial</Label>
          <Input
            id="treasury-startDate"
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange("startDate", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="treasury-endDate">Data final</Label>
          <Input
            id="treasury-endDate"
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange("endDate", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="treasury-type">Tipo</Label>
          <Select
            id="treasury-type"
            value={filters.type}
            onChange={(event) => onChange("type", event.target.value)}
          >
            <option value="">Todos</option>
            {TREASURY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="treasury-category">Categoria</Label>
          <Select
            id="treasury-category"
            value={filters.categoryId}
            onChange={(event) => onChange("categoryId", event.target.value)}
          >
            <option value="">Todas</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="treasury-church">Igreja</Label>
          <Select
            id="treasury-church"
            value={filters.churchId}
            onChange={(event) => onChange("churchId", event.target.value)}
          >
            <option value="">Todas</option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="treasury-status">Status</Label>
          <Select
            id="treasury-status"
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            <option value="">Todos</option>
            {TREASURY_STATUS_OPTIONS.map((option) => (
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
