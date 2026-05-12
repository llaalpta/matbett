"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBetBatchSummaryLogic } from "@/hooks/domain/bets/useBetBatchSummaryLogic";
import { getBetScenarioLabel } from "@/utils/bets";

import { BetBatchScenarioOutcomeTable } from "./summary/BetBatchScenarioOutcomeTable";

export function BetBatchSummarySection() {
  const {
    scenarioOutcomeSummary,
    scenarioId,
    shouldShowSummary,
    mainLeg,
    hedge1Leg,
  } = useBetBatchSummaryLogic();

  if (!shouldShowSummary) {
    return null;
  }

  const scenarioLabel = getBetScenarioLabel(scenarioId);

  return (
    <Card className="min-w-0 max-w-full gap-0 overflow-hidden rounded-lg py-0 shadow-none">
      <CardHeader className="border-b bg-muted/20 px-3 py-2">
        <CardTitle className="text-sm">Cálculo estimado</CardTitle>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {scenarioLabel}
        </p>
      </CardHeader>
      <CardContent className="p-3">
        {scenarioOutcomeSummary ? (
          <BetBatchScenarioOutcomeTable
            summary={scenarioOutcomeSummary}
            mainLeg={mainLeg}
            hedge1Leg={hedge1Leg}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
