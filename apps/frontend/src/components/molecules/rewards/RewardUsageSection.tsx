"use client";

import Link from "next/link";

import { RewardUsageTrackingSummary } from "@/components/molecules/UsageTrackingForm";
import { Button } from "@/components/ui/button";
import type { RewardServerModel } from "@/types/hooks";

type RewardUsageSectionProps = {
  reward: RewardServerModel;
  canLaunchBetEntry: boolean;
  betEntryHref?: string;
  betEntryDisabledReason?: string;
};

export function RewardUsageSection({
  reward,
  canLaunchBetEntry,
  betEntryHref,
  betEntryDisabledReason,
}: RewardUsageSectionProps) {
  const canUseReward = canLaunchBetEntry && Boolean(betEntryHref);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Uso de recompensa</h2>
          <p className="text-muted-foreground text-sm">
            Progreso de uso y acceso al registro contextual cuando el estado lo permite.
          </p>
        </div>

        {canUseReward && betEntryHref ? (
          <Link href={betEntryHref}>
            <Button type="button" size="sm">
              Usar recompensa
            </Button>
          </Link>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled
            title={betEntryDisabledReason}
          >
            Usar recompensa
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card p-3">
        <RewardUsageTrackingSummary rewardServerData={reward} />
        {!canUseReward && betEntryDisabledReason ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {betEntryDisabledReason}
          </p>
        ) : null}
      </div>
    </section>
  );
}
