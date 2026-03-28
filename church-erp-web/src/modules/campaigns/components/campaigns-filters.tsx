"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CAMPAIGN_STATUS_OPTIONS,
  type CampaignFilters,
} from "@/modules/campaigns/types/campaign";

interface ChurchOption {
  id: string;
  name: string;
}

interface CampaignsFiltersProps {
  filters: CampaignFilters;
  churchOptions: ChurchOption[];
  isLoading: boolean;
  onChange: (field: keyof CampaignFilters, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export function CampaignsFilters({
  filters,
  churchOptions,
  isLoading,
  onChange,
  onSubmit,
  onReset,
}: CampaignsFiltersProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="filter-campaign-title">Campanha</Label>
          <Input
            id="filter-campaign-title"
            placeholder="Buscar por titulo, descricao ou igreja"
            value={filters.title}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-campaign-church">Igreja</Label>
          <Select
            id="filter-campaign-church"
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

        <div className="space-y-2">
          <Label htmlFor="filter-campaign-status">Status</Label>
          <Select
            id="filter-campaign-status"
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            <option value="">Todos</option>
            {CAMPAIGN_STATUS_OPTIONS.map((option) => (
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
