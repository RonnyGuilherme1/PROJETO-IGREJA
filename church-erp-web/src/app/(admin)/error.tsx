"use client";

import { ErrorView } from "@/components/shared/error-view";

export default function AdminError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <ErrorView
      title="Falha ao carregar a area administrativa"
      description={
        error.message || "Ocorreu um erro inesperado ao montar o painel."
      }
      onAction={reset}
    />
  );
}
