"use client";

import { ErrorBanner } from "./ErrorBanner";

interface ApiErrorBannerProps {
  errorMessage?: string | null;
  onDismissError?: () => void;
  className?: string;
}

export function ApiErrorBanner({
  errorMessage,
  onDismissError,
  className,
}: ApiErrorBannerProps) {
  if (!errorMessage) {
    return null;
  }

  return (
    <ErrorBanner
      message={errorMessage}
      onDismiss={onDismissError}
      className={className}
    />
  );
}
