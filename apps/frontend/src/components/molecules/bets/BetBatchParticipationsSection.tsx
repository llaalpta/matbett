"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { InputField, SelectField, SwitchField } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { useBetParticipationCardSync } from "@/hooks/domain/bets/useBetParticipationCardSync";
import { useBetParticipationsLogic } from "@/hooks/domain/bets/useBetParticipationsLogic";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

import type { QualifyTrackingContext, RewardUsageContext } from "./types";

type BetBatchParticipationsSectionProps = {
  legIndex: number;
};

type ParticipationCardProps = {
  legIndex: number;
  participationIndex: number;
  onRemove: () => void;
  qualifyTrackingContexts: QualifyTrackingContext[];
  rewardUsageContexts: RewardUsageContext[];
  onContributionChange: (nextValue: boolean) => void;
};

export function BetBatchParticipationsSection({
  legIndex,
}: BetBatchParticipationsSectionProps) {
  const {
    leg,
    participations,
    removeParticipation,
    qualifyTrackingContexts,
    rewardUsageContexts,
    appendQualifyParticipation,
    appendRewardUsageParticipation,
    handleContributionChange,
  } = useBetParticipationsLogic({ legIndex });

  if (!leg) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Participaciones</h4>
          <p className="text-muted-foreground text-sm">
            Cada leg puede aportar a qualify tracking o usar una reward activa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={appendQualifyParticipation}
            disabled={!qualifyTrackingContexts.length}
          >
            Añadir QT
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={appendRewardUsageParticipation}
            disabled={!rewardUsageContexts.length}
          >
            Añadir RU
          </Button>
        </div>
      </div>

      {participations.map((participation, participationIndex) => (
        <ParticipationCard
          key={participation.participationKey ?? participationIndex}
          legIndex={legIndex}
          participationIndex={participationIndex}
          onRemove={() => removeParticipation(participationIndex)}
          qualifyTrackingContexts={qualifyTrackingContexts}
          rewardUsageContexts={rewardUsageContexts}
          onContributionChange={(nextValue) =>
            handleContributionChange(participationIndex, nextValue)
          }
        />
      ))}

      {participations.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
          Esta leg no participa todavía en ninguna promo.
        </div>
      ) : null}
    </div>
  );
}

function ParticipationCard({
  legIndex,
  participationIndex,
  onRemove,
  qualifyTrackingContexts,
  rewardUsageContexts,
  onContributionChange,
}: ParticipationCardProps) {
  const { control } = useFormContext<BetBatchFormValues>();
  const participation = useWatch({
    control,
    name: `legs.${legIndex}.participations.${participationIndex}`,
  });

  useBetParticipationCardSync({
    legIndex,
    participationIndex,
    participation,
    qualifyTrackingContexts,
    rewardUsageContexts,
  });

  if (!participation) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">
          {participation.kind === "QUALIFY_TRACKING"
            ? "Qualify tracking"
            : "Reward usage"}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Eliminar
        </Button>
      </div>

      {participation.kind === "QUALIFY_TRACKING" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField<BetBatchFormValues>
            name={`legs.${legIndex}.participations.${participationIndex}.qualifyConditionId`}
            label="Qualify condition"
            options={qualifyTrackingContexts.map((context) => ({
              value: context.qualifyConditionId,
              label: `${context.promotionName} · ${context.qualifyConditionType}`,
            }))}
          />
          <SelectField<BetBatchFormValues>
            name={`legs.${legIndex}.participations.${participationIndex}.calculationRewardId`}
            label="Reward de cálculo"
            options={
              qualifyTrackingContexts
                .find(
                  (context) =>
                    context.qualifyConditionId === participation.qualifyConditionId
                )
                ?.rewards.map((reward) => ({
                  value: reward.rewardId,
                  label: `${reward.phaseName} · ${reward.rewardType}`,
                })) ?? []
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField<BetBatchFormValues>
            name={`legs.${legIndex}.participations.${participationIndex}.usageTrackingId`}
            label="Reward disponible"
            options={rewardUsageContexts.map((context) => ({
              value: context.usageTrackingId,
              label: `${context.promotionName} · ${context.phaseName} · ${context.rewardType}`,
            }))}
          />
          <InputField<BetBatchFormValues>
            name={`legs.${legIndex}.participations.${participationIndex}.rewardId`}
            label="Reward ID"
            disabled
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <InputField<BetBatchFormValues>
          name={`legs.${legIndex}.participations.${participationIndex}.rewardType`}
          label="Reward type"
          disabled
        />
        <SwitchField<BetBatchFormValues>
          name={`legs.${legIndex}.participations.${participationIndex}.contributesToTracking`}
          label="Contribuye al tracking"
          onValueChange={onContributionChange}
        />
      </div>
    </div>
  );
}
