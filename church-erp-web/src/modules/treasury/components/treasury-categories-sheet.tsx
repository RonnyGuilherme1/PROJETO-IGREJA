"use client";

import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { TreasuryCategoryItem } from "@/modules/treasury/types/treasury";

interface TreasuryCategoriesSheetProps {
  categories: TreasuryCategoryItem[];
  isLoading: boolean;
  error?: string | null;
}

function getTypeLabel(type: string) {
  return type.toUpperCase() === "EXPENSE" ? "Saida" : "Entrada";
}

export function TreasuryCategoriesSheet({
  categories,
  isLoading,
  error,
}: TreasuryCategoriesSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <FolderKanban className="size-4" />
          Categorias
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-2">
          <SheetTitle>Categorias financeiras</SheetTitle>
          <SheetDescription>
            Consulte as categorias disponiveis para entradas e saidas financeiras.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl bg-secondary/60"
                />
              ))
            : null}

          {!isLoading && categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Nenhuma categoria financeira encontrada.
            </div>
          ) : null}

          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {category.id}
                  </p>
                </div>
                <Badge variant={category.type === "EXPENSE" ? "outline" : "secondary"}>
                  {getTypeLabel(category.type)}
                </Badge>
              </div>

              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>Status: {category.status || "-"}</p>
                <p>{category.description || "Sem descricao."}</p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
