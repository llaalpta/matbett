"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "bg-card flex flex-col gap-3 rounded-lg border px-4 py-3 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}
