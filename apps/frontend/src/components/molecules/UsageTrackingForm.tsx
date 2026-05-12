"use client";

import { Progress } from "@/components/ui/progress";
import type { RewardServerModel } from "@/types/hooks";
import { formatCurrencyAmount } from "@/utils/formatters";

type UsageMetric = {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning" | "info";
};

type RewardUsageTrackingSummaryProps = {
  rewardServerData?: RewardServerModel;
};

const metricToneClass = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  info: "text-sky-700 dark:text-sky-400",
} satisfies Record<NonNullable<UsageMetric["tone"]>, string>;

function UsageMetricGrid({ metrics }: { metrics: UsageMetric[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-md border bg-background px-3 py-2">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.05em]">
            {metric.label}
          </div>
          <div
            className={`mt-0.5 text-sm font-semibold tabular-nums ${metricToneClass[metric.tone ?? "default"]}`}
          >
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RewardUsageTrackingSummary({
  rewardServerData,
}: RewardUsageTrackingSummaryProps) {
  if (!rewardServerData?.usageTracking) {
    return (
      <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
        No hay datos de uso todavía. Los datos aparecerán cuando se registre el
        primer uso de esta recompensa.
      </div>
    );
  }

  const { usageTracking, type: rewardType } = rewardServerData;

  if (rewardType === "FREEBET" && usageTracking.type === "FREEBET") {
    return (
      <UsageMetricGrid
        metrics={[
          {
            label: "Total usado",
            value: formatCurrencyAmount(usageTracking.totalUsed),
          },
          {
            label: "Balance restante",
            value: formatCurrencyAmount(usageTracking.remainingBalance),
            tone: "positive",
          },
        ]}
      />
    );
  }

  if (
    rewardType === "CASHBACK_FREEBET" &&
    usageTracking.type === "CASHBACK_FREEBET"
  ) {
    return (
      <UsageMetricGrid
        metrics={[
          {
            label: "Cashback generado",
            value: formatCurrencyAmount(usageTracking.totalCashback),
          },
        ]}
      />
    );
  }

  if (
    rewardType === "BET_BONUS_ROLLOVER" &&
    usageTracking.type === "BET_BONUS_ROLLOVER"
  ) {
    const denominator =
      usageTracking.rolloverProgress + usageTracking.remainingRollover;
    const progress =
      denominator > 0
        ? Math.min((usageTracking.rolloverProgress / denominator) * 100, 100)
        : 0;

    return (
      <div className="space-y-3">
        <UsageMetricGrid
          metrics={[
            {
              label: "Total usado",
              value: formatCurrencyAmount(usageTracking.totalUsed),
            },
            {
              label: "Rollover completado",
              value: formatCurrencyAmount(usageTracking.rolloverProgress),
              tone: "info",
            },
            {
              label: "Rollover restante",
              value: formatCurrencyAmount(usageTracking.remainingRollover),
              tone: "warning",
            },
          ]}
        />
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progreso del rollover</span>
            <span className="font-medium tabular-nums">
              {formatCurrencyAmount(usageTracking.rolloverProgress)} apostados
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    );
  }

  if (
    rewardType === "BET_BONUS_NO_ROLLOVER" &&
    usageTracking.type === "BET_BONUS_NO_ROLLOVER"
  ) {
    return (
      <UsageMetricGrid
        metrics={[
          {
            label: "Total usado",
            value: formatCurrencyAmount(usageTracking.totalUsed),
          },
        ]}
      />
    );
  }

  if (rewardType === "ENHANCED_ODDS" && usageTracking.type === "ENHANCED_ODDS") {
    return (
      <UsageMetricGrid
        metrics={[
          {
            label: "Cuotas utilizadas",
            value: usageTracking.oddsUsed ? "Sí" : "No",
            tone: usageTracking.oddsUsed ? "positive" : "default",
          },
        ]}
      />
    );
  }

  if (rewardType === "CASINO_SPINS" && usageTracking.type === "CASINO_SPINS") {
    return (
      <UsageMetricGrid
        metrics={[
          {
            label: "Spins usados",
            value: usageTracking.spinsUsed.toString(),
          },
          {
            label: "Spins restantes",
            value: usageTracking.remainingSpins.toString(),
            tone: "positive",
          },
        ]}
      />
    );
  }

  return (
    <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
      El tracking de uso no coincide con el tipo actual de recompensa.
    </div>
  );
}

export function UsageTrackingForm(props: RewardUsageTrackingSummaryProps) {
  return <RewardUsageTrackingSummary {...props} />;
}
