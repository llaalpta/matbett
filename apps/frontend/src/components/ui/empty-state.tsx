"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="bg-muted text-muted-foreground mb-4 rounded-md p-3">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
