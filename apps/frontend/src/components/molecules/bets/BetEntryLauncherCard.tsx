"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BetEntryLauncherCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
  disabledReason?: string;
};

export function BetEntryLauncherCard({
  title,
  description,
  actionLabel,
  href,
  disabledReason,
}: BetEntryLauncherCardProps) {
  return (
    <Card className="border-sky-200 bg-sky-50/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {href ? (
          <Link href={href}>
            <Button type="button">{actionLabel}</Button>
          </Link>
        ) : (
          <Button type="button" disabled>
            {actionLabel}
          </Button>
        )}

        {disabledReason ? (
          <p className="text-sm text-muted-foreground">{disabledReason}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
