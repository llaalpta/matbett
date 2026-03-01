"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DetailGridProps = {
  children: ReactNode;
  className?: string;
};

type DetailRowProps = {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
};

export function DetailGrid({ children, className }: DetailGridProps) {
  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DetailRow({
  label,
  value,
  className,
  valueClassName,
}: DetailRowProps) {
  return (
    <div className={cn("grid gap-1", className)}>
      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
        {label}
      </dt>
      <dd className={cn("text-sm font-medium", valueClassName)}>{value}</dd>
    </div>
  );
}
