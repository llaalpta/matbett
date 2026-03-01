"use client";

import { InputField, SelectField } from "@/components/atoms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBetBatchSummaryLogic } from "@/hooks/domain/bets/useBetBatchSummaryLogic";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

import { BetBatchScenarioOutcomeTable } from "./summary/BetBatchScenarioOutcomeTable";

export function BetBatchSummarySection() {
  const { scenarioOutcomeSummary, targetOptions, mainLeg, hedge1Leg } =
    useBetBatchSummaryLogic();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen y cálculo</CardTitle>
        <CardDescription>
          En matched betting simple, BACK representa la apuesta principal y LAY
          la cobertura en exchange. El stake total se muestra como turnover real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {targetOptions.length > 0 ? (
          <SelectField<BetBatchFormValues>
            name="calculation.target.participationKey"
            label="Participación objetivo"
            options={targetOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        ) : null}

        {scenarioOutcomeSummary ? (
          <BetBatchScenarioOutcomeTable
            summary={scenarioOutcomeSummary}
            mainLeg={mainLeg}
            hedge1Leg={hedge1Leg}
          />
        ) : null}

        <div
          className={
            scenarioOutcomeSummary
              ? "grid gap-4 md:grid-cols-1"
              : "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          }
        >
          <InputField<BetBatchFormValues>
            name="calculation.scenarioId"
            label="Scenario ID"
            disabled
          />
          {!scenarioOutcomeSummary ? (
            <>
              <InputField<BetBatchFormValues>
                name="profit"
                label="Profit total"
                type="number"
                disabled
              />
              <InputField<BetBatchFormValues>
                name="risk"
                label="Risk total"
                type="number"
                disabled
              />
              <InputField<BetBatchFormValues>
                name="yield"
                label="Yield total"
                type="number"
                disabled
              />
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
