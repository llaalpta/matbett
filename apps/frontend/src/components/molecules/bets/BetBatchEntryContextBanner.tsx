"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BetBatchInitialContext } from "@/hooks/useBetBatchForm";

type BetBatchEntryContextBannerProps = {
  initialContext?: BetBatchInitialContext;
};

export function BetBatchEntryContextBanner({
  initialContext,
}: BetBatchEntryContextBannerProps) {
  if (!initialContext) {
    return null;
  }

  return (
    <Card className="border-sky-200 bg-sky-50/40">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">
            {initialContext.entryType === "qualify-condition"
              ? "Entrada contextual desde qualify condition"
              : "Entrada contextual desde reward"}
          </CardTitle>
          <Badge variant="outline">
            {initialContext.entryType === "qualify-condition" ? "QC" : "Reward"}
          </Badge>
          <Badge variant="secondary">Contexto aplicado</Badge>
        </div>
        <CardDescription>
          {initialContext.entryType === "qualify-condition"
            ? "El formulario se ha abierto desde una qualify condition que puede registrar apuestas."
            : "El formulario se ha abierto desde una reward utilizable en apuestas."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="text-sm">
            <span className="font-medium">Promoción:</span>{" "}
            {initialContext.promotionName ?? "Sin dato"}
          </div>
          <div className="text-sm">
            <span className="font-medium">Cuenta:</span>{" "}
            {initialContext.bookmakerAccountId}
          </div>
          {initialContext.entryType === "qualify-condition" ? (
            <div className="text-sm">
              <span className="font-medium">Condición:</span>{" "}
              {initialContext.sourceLabel ?? "Sin dato"}
            </div>
          ) : (
            <>
              <div className="text-sm">
                <span className="font-medium">Reward:</span>{" "}
                {initialContext.sourceLabel ?? "Sin dato"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Fase:</span>{" "}
                {initialContext.phaseName ?? "Sin dato"}
              </div>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          La cuenta y la primera participación contextual ya se han precargado en
          el formulario.
        </p>

        {initialContext.returnHref ? (
          <Link href={initialContext.returnHref}>
            <Button type="button" variant="outline">
              {initialContext.returnLabel ?? "Volver al origen"}
            </Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
