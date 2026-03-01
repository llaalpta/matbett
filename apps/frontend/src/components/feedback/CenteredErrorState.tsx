"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/utils/errors";

import { ApiErrorBanner } from "./ApiErrorBanner";

interface CenteredErrorStateProps {
  error?: unknown;
  fallbackMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  backHref?: string;
  backLabel?: string;
}

export function CenteredErrorState({
  error,
  fallbackMessage = "No se pudo cargar la información.",
  onRetry,
  retryLabel = "Reintentar",
  backHref,
  backLabel = "Volver",
}: CenteredErrorStateProps) {
  const message = getErrorMessage(error, fallbackMessage);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="w-full max-w-2xl space-y-4">
        <ApiErrorBanner errorMessage={message} />

        <div className="flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
          {backHref ? (
            <Link href={backHref}>
              <Button type="button">{backLabel}</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
