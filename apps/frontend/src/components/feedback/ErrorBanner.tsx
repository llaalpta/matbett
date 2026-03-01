"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorBannerProps {
  message?: string | null;
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}

export function ErrorBanner({
  message,
  onDismiss,
  className,
  children,
}: ErrorBannerProps) {
  const hasContent = Boolean(message) || Boolean(children);
  if (!hasContent) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className}>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="absolute right-1 top-1 h-7 w-7"
          aria-label="Cerrar mensaje de error"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
      <AlertDescription className="pr-10 text-destructive">
        {message}
        {children}
      </AlertDescription>
    </Alert>
  );
}
