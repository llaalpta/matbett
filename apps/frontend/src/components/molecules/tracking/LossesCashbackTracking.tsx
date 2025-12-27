"use client";

import { qualifyTrackingStatusOptions } from "@matbett/shared";
import { Control, FieldPath } from "react-hook-form";

import { InputField, SelectField } from "@/components/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PromotionFormData } from "@/types/hooks";

interface LossesCashbackTrackingProps {
  control: Control<PromotionFormData>;
  basePath: string;
}

export function LossesCashbackTracking({
  control,
  basePath,
}: LossesCashbackTrackingProps) {
  return (
    <Card className="border-muted-foreground/30 border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Seguimiento de Condición de Calificación (Cashback de Pérdidas de
          Apuestas)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SelectField
          control={control}
          name={`${basePath}.tracking.status` as FieldPath<PromotionFormData>}
          label="Estado del Seguimiento"
          options={qualifyTrackingStatusOptions}
        />

        <Separator />

        <div className="space-y-2">
          <h5 className="text-sm font-medium">Acumuladores Dinámicos</h5>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              control={control}
              name={
                `${basePath}.tracking.totalStakes` as FieldPath<PromotionFormData>
              }
              label="Total Apostado (€)"
              type="number"
              placeholder="0"
            />
            <InputField
              control={control}
              name={
                `${basePath}.tracking.totalWinnings` as FieldPath<PromotionFormData>
              }
              label="Total Ganado (€)"
              type="number"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              control={control}
              name={
                `${basePath}.tracking.totalLosses` as FieldPath<PromotionFormData>
              }
              label="Total Perdido (€)"
              type="number"
              placeholder="0"
            />
            <InputField
              control={control}
              name={
                `${basePath}.tracking.calculatedCashbackAmount` as FieldPath<PromotionFormData>
              }
              label="Cashback Calculado (€)"
              type="number"
              placeholder="0"
            />
          </div>

          <InputField
            control={control}
            name={
              `${basePath}.tracking.appliedMaxLimit` as FieldPath<PromotionFormData>
            }
            label="Límite Aplicado (€)"
            type="number"
            placeholder="0"
          />
        </div>

        <Separator />

        <div className="text-muted-foreground text-sm">
          <p className="mb-1">IDs de Apuestas Calificadas:</p>
          <div className="bg-muted/50 rounded p-2 text-xs">
            Los IDs de las apuestas que califican para cashback se gestionan
            automáticamente
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
