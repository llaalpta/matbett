"use client";

import { type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "success" | "warning" | "info" | "danger" | "neutral";

const successStatuses = new Set([
  "COMPLETED",
  "FULFILLED",
  "USED",
  "WON",
  "QUALIFIED",
]);

const warningStatuses = new Set([
  "PENDING",
  "QUALIFYING",
  "PENDING_TO_CLAIM",
  "CLAIMED",
  "OPEN",
  "TRACKING",
]);

const infoStatuses = new Set(["ACTIVE", "RECEIVED", "IN_USE", "CASHOUT"]);

const dangerStatuses = new Set(["FAILED", "EXPIRED", "LOST", "VOID"]);

function getStatusTone(status?: string | null): StatusTone {
  if (!status) {
    return "neutral";
  }

  if (successStatuses.has(status)) {
    return "success";
  }

  if (warningStatuses.has(status)) {
    return "warning";
  }

  if (infoStatuses.has(status)) {
    return "info";
  }

  if (dangerStatuses.has(status)) {
    return "danger";
  }

  if (status === "NOT_STARTED") {
    return "neutral";
  }

  return "neutral";
}

const toneClassByStatus: Record<StatusTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  info:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  neutral:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

type StatusBadgeProps = {
  status?: string | null;
  label?: ReactNode;
  tone?: StatusTone;
  className?: string;
  title?: string;
};

export function StatusBadge({
  status,
  label,
  tone,
  className,
  title,
}: StatusBadgeProps) {
  const resolvedTone = tone ?? getStatusTone(status);

  return (
    <Badge
      variant="outline"
      title={title}
      className={cn(
        "rounded-sm px-2 py-0.5 text-[11px] font-semibold tracking-[0.01em]",
        toneClassByStatus[resolvedTone],
        className
      )}
    >
      {label ?? status ?? "Sin estado"}
    </Badge>
  );
}
