export interface TreasuryMovementItem {
  id: string;
  churchId: string;
  churchName: string;
  categoryId: string;
  categoryName: string;
  type: string;
  description: string;
  amount: number;
  transactionDate: string;
  notes: string;
  status: string;
}

export interface TreasuryCategoryItem {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
}

export interface TreasuryFilters {
  startDate: string;
  endDate: string;
  type: string;
  categoryId: string;
  churchId: string;
}

export interface TreasurySummary {
  income: number;
  expense: number;
  balance: number;
}

export interface TreasuryListResult {
  items: TreasuryMovementItem[];
  total: number;
  summary: TreasurySummary;
}

export interface CreateTreasuryPayload {
  churchId: string;
  categoryId: string;
  type: string;
  description: string;
  amount: number;
  transactionDate: string;
  notes: string;
  status: string;
}

export interface UpdateTreasuryPayload {
  churchId: string;
  categoryId: string;
  type: string;
  description: string;
  amount: number;
  transactionDate: string;
  notes: string;
  status: string;
}

export interface TreasuryFormValues {
  churchId: string;
  categoryId: string;
  type: string;
  description: string;
  amount: string;
  transactionDate: string;
  notes: string;
  status: string;
}

export const TREASURY_TYPE_OPTIONS = [
  { value: "INCOME", label: "Entrada" },
  { value: "EXPENSE", label: "Saida" },
] as const;
