export type TreasuryType = "ENTRY" | "EXPENSE";

export type TreasuryTransactionStatus = "ACTIVE" | "CANCELLED";

export interface TreasuryMovementItem {
  id: string;
  churchId: string;
  churchName: string;
  categoryId: string;
  categoryName: string;
  type: TreasuryType;
  description: string;
  amount: number;
  transactionDate: string;
  notes: string;
  status: TreasuryTransactionStatus;
}

export interface TreasuryCategoryItem {
  id: string;
  name: string;
  type: TreasuryType;
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
  type: TreasuryType;
  description: string;
  amount: number;
  transactionDate: string;
  notes: string;
}

export interface UpdateTreasuryPayload {
  churchId: string;
  categoryId: string;
  type: TreasuryType;
  description: string;
  amount: number;
  transactionDate: string;
  notes: string;
  status?: TreasuryTransactionStatus;
}

export interface TreasuryFormValues {
  churchId: string;
  categoryId: string;
  type: TreasuryType;
  description: string;
  amount: string;
  transactionDate: string;
  notes: string;
  status: TreasuryTransactionStatus;
}

export const TREASURY_TYPE_OPTIONS = [
  { value: "ENTRY", label: "Entrada" },
  { value: "EXPENSE", label: "Saida" },
] as const;

export const TREASURY_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativa" },
  { value: "CANCELLED", label: "Cancelada" },
] as const;
