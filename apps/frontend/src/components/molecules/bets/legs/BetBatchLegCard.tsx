"use client";

import { betStatusOptions } from "@matbett/shared";

import { DateTimeField, InputField, SelectField } from "@/components/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBetLegCardLogic } from "@/hooks/domain/bets/useBetLegCardLogic";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import { getBetOperationBetSummary } from "@/utils/bets";

import type { BookmakerAccountLike } from "../types";

import { BetBatchSelectionsSection } from "./BetBatchSelectionsSection";
import { BetLegAdjustmentSection } from "./BetLegAdjustmentSection";
import { SingleMatchedLegConfiguration } from "./SingleMatchedLegConfiguration";

type BetBatchLegCardProps = {
  legIndex: number;
  mode: "create" | "edit";
  bookmakerAccounts: BookmakerAccountLike[];
};

export function BetBatchLegCard({
  legIndex,
  mode,
  bookmakerAccounts,
}: BetBatchLegCardProps) {
  const {
    leg,
    operation,
    strategy,
    bookmakerOptions,
    isSingleMatchedLayout,
    isMainLeg,
    sharedEvent,
    derivedHedge1Selection,
    hideGenericSelections,
    hideCalculatedLegMetrics,
    shouldRenderAdjustmentSection,
    legAdjustmentOptions,
    selectedAdjustment,
    setSelectedAdjustment,
  } = useBetLegCardLogic({
    legIndex,
    mode,
    bookmakerAccounts,
  });

  if (!leg) {
    return null;
  }

  const roleSummary = getBetOperationBetSummary({
    index: legIndex,
    operation,
    role: leg.legRole,
    strategy,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 px-4 py-3">
        <CardTitle className="text-sm">{roleSummary.label}</CardTitle>
        <p className="text-muted-foreground text-xs">
          {roleSummary.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {isSingleMatchedLayout ? (
          <SingleMatchedLegConfiguration
            legIndex={legIndex}
            bookmakerOptions={bookmakerOptions}
            isMainLeg={isMainLeg}
            sharedEvent={sharedEvent}
            derivedHedge1Selection={derivedHedge1Selection}
          />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SelectField<BetBatchFormValues>
                name={`legs.${legIndex}.bookmakerAccountId`}
                label="Cuenta"
                options={bookmakerOptions}
                required
              />
              <InputField<BetBatchFormValues>
                name={`legs.${legIndex}.odds`}
                label="Cuota"
                type="number"
                step={0.01}
                required
                treatZeroAsEmpty
              />
              <InputField<BetBatchFormValues>
                name={`legs.${legIndex}.stake`}
                label="Stake"
                type="number"
                step={0.01}
                required
                treatZeroAsEmpty
              />
              <InputField<BetBatchFormValues>
                name={`legs.${legIndex}.commission`}
                label="Comisión %"
                type="number"
                step={0.01}
              />
              {!hideCalculatedLegMetrics ? (
                <>
                  <InputField<BetBatchFormValues>
                    name={`legs.${legIndex}.profit`}
                    label="Profit"
                    type="number"
                    step={0.01}
                  />
                  <InputField<BetBatchFormValues>
                    name={`legs.${legIndex}.risk`}
                    label="Risk"
                    type="number"
                    step={0.01}
                  />
                  <InputField<BetBatchFormValues>
                    name={`legs.${legIndex}.yield`}
                    label="Yield"
                    type="number"
                    step={0.01}
                  />
                </>
              ) : null}
              <SelectField<BetBatchFormValues>
                name={`legs.${legIndex}.status`}
                label="Estado"
                options={betStatusOptions}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DateTimeField<BetBatchFormValues>
                name={`legs.${legIndex}.placedAt`}
                label="Fecha de colocación"
              />
            </div>
          </>
        )}

        {shouldRenderAdjustmentSection ? (
          <BetLegAdjustmentSection
            options={legAdjustmentOptions}
            value={selectedAdjustment}
            onValueChange={setSelectedAdjustment}
          />
        ) : null}

        {!hideGenericSelections ? (
          <BetBatchSelectionsSection legIndex={legIndex} />
        ) : null}
      </CardContent>
    </Card>
  );
}
