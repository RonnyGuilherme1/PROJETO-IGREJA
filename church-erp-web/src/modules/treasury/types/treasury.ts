export type TreasuryType = "ENTRY" | "EXPENSE";

export type TreasuryTransactionStatus = "ACTIVE" | "CANCELLED";

export interface TreasuryMovementItem {
  id: string;
  churchId: string;
  categoryId: string;
  type: TreasuryType;
  description: string;
  amount: string;
  transactionDate: string;
  notes: string | null;
  status: TreasuryTransactionStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreasuryCategoryItem {
  id: string;
  name: string;
  type: TreasuryType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
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
  amount: string;
  transactionDate: string;
  notes: string;
}

export interface UpdateTreasuryPayload {
  churchId?: string;
  categoryId?: string;
  type?: TreasuryType;
  description?: string;
  amount?: string;
  transactionDate?: string;
  notes?: string | null;
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
