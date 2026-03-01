"use client";

import { strategyKindOptions } from "@matbett/shared";
import { useFormContext } from "react-hook-form";

import { SelectField } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBetBatchStrategyLogic } from "@/hooks/domain/bets/useBetBatchStrategyLogic";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

type BetBatchStrategySectionProps = {
  mode: "create" | "edit";
  defaultBookmakerAccountId: string;
};

export function BetBatchStrategySection({
  mode,
  defaultBookmakerAccountId,
}: BetBatchStrategySectionProps) {
  const form = useFormContext<BetBatchFormValues>();
  const {
    strategy,
    availability,
    strategyTypeOptionsFiltered,
    lineModeOptionsFiltered,
    modeOptionsFiltered,
  } = useBetBatchStrategyLogic({
    mode,
    defaultBookmakerAccountId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estrategia</CardTitle>
        <CardDescription>
          La configuración se deriva del catálogo cerrado de escenarios soportados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid items-start gap-4 md:grid-cols-4">
          <SelectField<BetBatchFormValues>
            name="strategy.kind"
            label="Cobertura"
            options={strategyKindOptions}
            required
            containerClassName="md:col-span-1"
          />

          {strategy.kind === "HEDGE" ? (
            <>
              <SelectField<BetBatchFormValues>
                name="strategy.strategyType"
                label="Tipo de estrategia"
                options={strategyTypeOptionsFiltered}
                required
                containerClassName="md:col-span-1"
              />
              <SelectField<BetBatchFormValues>
                name="strategy.lineMode"
                label="Formato"
                options={lineModeOptionsFiltered}
                required
                containerClassName="md:col-span-1"
              />
              <SelectField<BetBatchFormValues>
                name="strategy.mode"
                label="Modo"
                options={modeOptionsFiltered}
                required
                containerClassName="md:col-span-1"
              />
            </>
          ) : null}
        </div>

        {strategy.kind === "HEDGE" &&
        strategy.strategyType === "DUTCHING" &&
        strategy.lineMode === "SINGLE" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Opciones de dutching</label>
            <div className="flex gap-2">
              {(availability?.dutchingOptionsCounts ?? []).map((count) => (
                <Button
                  key={count}
                  type="button"
                  variant={
                    strategy.dutchingOptionsCount === count ? "default" : "outline"
                  }
                  onClick={() =>
                    form.setValue("strategy.dutchingOptionsCount", count)
                  }
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
