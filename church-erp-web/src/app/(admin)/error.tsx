"use client";

import { ErrorView } from "@/components/shared/error-view";
import { getApiErrorMessage } from "@/lib/http";

export default function AdminError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <ErrorView
      title="Nao foi possivel abrir esta area"
      description={getApiErrorMessage(
        error,
        "Ocorreu uma instabilidade momentanea ao carregar o painel.",
      )}
      onAction={reset}
    />
  );
}
