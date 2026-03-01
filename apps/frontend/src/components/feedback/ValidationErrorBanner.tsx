"use client";

import type { RefObject } from "react";
import { useMemo } from "react";
import type { FieldErrors, FieldValues } from "react-hook-form";

import { ErrorBanner } from "./ErrorBanner";

export type ValidationErrorMode = "generic" | "first" | "all";

interface ValidationErrorBannerProps<TFieldValues extends FieldValues> {
  errors: FieldErrors<TFieldValues>;
  submitCount: number;
  containerRef?: RefObject<HTMLDivElement | null>;
  onDismiss?: () => void;
  mode?: ValidationErrorMode;
  genericMessage?: string;
  className?: string;
}

const DEFAULT_GENERIC_MESSAGE =
  "Faltan campos obligatorios por rellenar o hay valores invalidos.";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const collectMessages = (value: unknown, messages: string[]): void => {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectMessages(item, messages);
    }
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  if ("message" in value) {
    const message = Reflect.get(value, "message");
    if (typeof message === "string" && message.trim().length > 0) {
      messages.push(message);
    }
  }

  for (const nestedValue of Object.values(value)) {
    collectMessages(nestedValue, messages);
  }
};

export function ValidationErrorBanner<TFieldValues extends FieldValues>({
  errors,
  submitCount,
  containerRef,
  onDismiss,
  mode = "generic",
  genericMessage = DEFAULT_GENERIC_MESSAGE,
  className,
}: ValidationErrorBannerProps<TFieldValues>) {
  const messages = useMemo(() => {
    const collected: string[] = [];
    collectMessages(errors, collected);
    return [...new Set(collected)];
  }, [errors]);

  const hasErrors = submitCount > 0 && messages.length > 0;
  if (!hasErrors) {
    return null;
  }

  if (mode === "all") {
    return (
      <div ref={containerRef} data-validation-error-banner="true" tabIndex={-1}>
        <ErrorBanner onDismiss={onDismiss} className={className}>
          <div className="space-y-2">
            <p>Revisa los siguientes errores:</p>
            <ul className="list-disc space-y-1 pl-5">
              {messages.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        </ErrorBanner>
      </div>
    );
  }

  const message = mode === "first" ? messages[0] : genericMessage;
  return (
    <div ref={containerRef} data-validation-error-banner="true" tabIndex={-1}>
      <ErrorBanner message={message} onDismiss={onDismiss} className={className} />
    </div>
  );
}
