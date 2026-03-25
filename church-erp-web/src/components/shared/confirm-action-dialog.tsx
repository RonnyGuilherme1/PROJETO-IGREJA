"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive" | "secondary";
  isLoading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirmVariant = "destructive",
  isLoading = false,
  onConfirm,
  onOpenChange,
}: ConfirmActionDialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isLoading) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/45 transition-opacity",
            "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
          )}
        />

        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md",
            "-translate-x-1/2 -translate-y-1/2 rounded-[28px] border bg-card p-6 shadow-2xl",
            "duration-200 data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
            "data-[state=open]:scale-100 data-[state=open]:opacity-100",
          )}
          onEscapeKeyDown={(event) => {
            if (isLoading) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (isLoading) {
              event.preventDefault();
            }
          }}
        >
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-md p-1 text-current opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-40"
            disabled={isLoading}
          >
            <X className="size-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>

          <div className="space-y-5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-700">
              <TriangleAlert className="size-5" />
            </div>

            <div className="space-y-2">
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-6 text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={confirmVariant}
                onClick={onConfirm}
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                {confirmLabel}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
