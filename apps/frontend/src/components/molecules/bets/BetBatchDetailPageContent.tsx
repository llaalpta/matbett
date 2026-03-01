"use client";

import {
  betParticipationKindOptions,
  betStatusOptions,
  getScenarioNaturalLabel,
  hedgeRoleOptions,
  optionsOptions,
  rewardTypeOptions,
  type BetRegistrationBatch,
} from "@matbett/shared";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import {
  formatCurrencyAmount,
  formatFixedNumber,
  formatFixedPercentage,
  formatSignedCurrencyAmount,
} from "@/utils/formatters";

function getBatchPresentation(batch: BetRegistrationBatch) {
  const scenarioLabel = batch.scenarioId
    ? getScenarioNaturalLabel(batch.scenarioId)
    : null;
  const firstEvent = batch.events[0];
  const eventSummary = firstEvent
    ? `${firstEvent.eventName}${firstEvent.marketName ? ` · ${firstEvent.marketName}` : ""}`
    : "Sin evento";

  return {
    title: scenarioLabel?.primary ?? "Batch de apuestas",
    subtitle: scenarioLabel
      ? `${scenarioLabel.secondary} · ${eventSummary}`
      : eventSummary,
  };
}

function BatchValue({
  value,
  tone = "neutral",
}: {
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <div
      className={cn(
        "text-right font-medium tabular-nums",
        tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        tone === "negative" && "text-red-600 dark:text-red-400"
      )}
    >
      {value}
    </div>
  );
}

function getOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined,
  fallback = "Sin valor"
) {
  if (!value) {
    return fallback;
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

function getLegRoleLabel(role: string | undefined) {
  return getOptionLabel(hedgeRoleOptions, role, "Leg");
}

function getParticipationLabel(
  participation: BetRegistrationBatch["legs"][number]["participations"][number]
) {
  return `${getOptionLabel(
    betParticipationKindOptions,
    participation.kind
  )} · ${getOptionLabel(rewardTypeOptions, participation.rewardType)}`;
}

export function BetBatchDetailPageContent({
  batch,
}: {
  batch: BetRegistrationBatch;
}) {
  const batchPresentation = getBatchPresentation(batch);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bets/batches">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a batches
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{batchPresentation.title}</h1>
            <p className="text-muted-foreground">{batchPresentation.subtitle}</p>
          </div>
        </div>
        <Link href={`/bets/${batch.id}`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuración del batch</CardTitle>
            <CardDescription>{batch.id}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>Profit {formatSignedCurrencyAmount(batch.profit)}</div>
            <div>Risk {formatSignedCurrencyAmount(batch.risk)}</div>
            <div>Yield {formatFixedPercentage(batch.yield)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {batch.events.map((event, index) => (
              <div key={`${event.eventName}-${index}`} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{event.eventName}</p>
                <p className="text-muted-foreground">
                  {event.marketName} · {getOptionLabel(optionsOptions, event.eventOptions)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legs</CardTitle>
            <CardDescription>Vista plana de las apuestas registradas dentro del batch.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left text-xs font-semibold tracking-[0.04em]">Rol</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold tracking-[0.04em]">Estado</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold tracking-[0.04em]">Selección</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold tracking-[0.04em]">Stake</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold tracking-[0.04em]">Cuota</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold tracking-[0.04em]">Profit</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold tracking-[0.04em]">Risk</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold tracking-[0.04em]">Yield</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold tracking-[0.04em]">Participaciones</th>
                </tr>
              </thead>
              <tbody>
                {batch.legs.map((leg) => (
                  <tr key={leg.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium">{getLegRoleLabel(leg.legRole)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        status={leg.status}
                        label={getOptionLabel(betStatusOptions, leg.status)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {leg.selections.map((selection, index) => (
                          <div key={`${selection.eventIndex}-${index}`}>
                            Evento {selection.eventIndex + 1}: {selection.selection}
                            {selection.odds ? ` · ${selection.odds}` : ""}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <BatchValue value={formatCurrencyAmount(leg.stake)} />
                    </td>
                    <td className="px-3 py-2">
                      <BatchValue value={formatFixedNumber(leg.odds)} />
                    </td>
                    <td className="px-3 py-2">
                      <BatchValue
                        value={formatSignedCurrencyAmount(leg.profit)}
                        tone={
                          leg.profit > 0
                            ? "positive"
                            : leg.profit < 0
                              ? "negative"
                              : "neutral"
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <BatchValue
                        value={formatSignedCurrencyAmount(leg.risk)}
                        tone={
                          leg.risk < 0 ? "negative" : leg.risk > 0 ? "positive" : "neutral"
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <BatchValue value={formatFixedPercentage(leg.yield)} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {leg.participations.map((participation) => (
                          <div key={participation.id}>
                            {getParticipationLabel(participation)}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
