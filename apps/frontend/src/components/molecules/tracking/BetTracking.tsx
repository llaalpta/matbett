"use client";

import { qualifyTrackingStatusOptions } from "@matbett/shared";
import { Control, FieldPath } from "react-hook-form";

import { InputField, SelectField } from "@/components/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PromotionFormData } from "@/types/hooks";

interface BetTrackingProps {
  control: Control<PromotionFormData>;
  basePath: string;
}

export function BetTracking({ control, basePath }: BetTrackingProps) {
  return (
    <Card className="border-muted-foreground/30 border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Seguimiento de Condición de Calificación (Apuesta)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            control={control}
            name={`${basePath}.tracking.status` as FieldPath<PromotionFormData>}
            label="Estado del Seguimiento"
            options={qualifyTrackingStatusOptions}
          />
          <InputField
            control={control}
            name={
              `${basePath}.tracking.currentAttempts` as FieldPath<PromotionFormData>
            }
            label="Intentos Actuales"
            type="number"
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <InputField
            control={control}
            name={
              `${basePath}.tracking.successfulBetId` as FieldPath<PromotionFormData>
            }
            label="ID de Apuesta Exitosa"
            placeholder="bet_123456"
          />

          <div className="text-muted-foreground text-sm">
            <p className="mb-1">IDs de Apuestas Intentadas:</p>
            <div className="bg-muted/50 rounded p-2 text-xs">
              Los IDs se gestionan automáticamente por el sistema
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
