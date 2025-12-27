"use client";

import {
  bookmakerOptions,
  activationMethodOptions,
  promotionStatusOptions,
  promotionCardinalityOptions,
} from '@matbett/shared';
import { useFormContext, Path } from "react-hook-form";

import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { TextareaField } from "@/components/atoms/TextareaField";
import { TypographyH2 } from "@/components/atoms/Typography";
import type { PromotionFormData, PromotionServerModel } from "@/types/hooks";
import { useStatusDateSync } from "@/hooks/useStatusDateSync";
import { DateTimeField } from "@/components/atoms/DateTimeField";

import { TimeframeForm } from "./TimeframeForm";

interface PromotionBasicInfoFormProps {
  onSinglePhaseChange?: (value: string) => void;
  onNameChange?: (value: string | number | undefined) => void;
  onDescriptionChange?: (value: string | undefined) => void;
  serverData?: PromotionServerModel;
}

export function PromotionBasicInfoForm({
  onSinglePhaseChange,
  onNameChange,
  onDescriptionChange,
  serverData,
}: PromotionBasicInfoFormProps) {
  // 1. Obtener contexto
  const { control, setValue } = useFormContext<PromotionFormData>();

  // 2. Sincronizar fecha de estado
  useStatusDateSync({
    control,
    setValue,
    statusPath: "status" as Path<PromotionFormData>,
    datePath: "statusDate" as Path<PromotionFormData>,
    serverDates: serverData,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        
        {/* Primeros 4 campos en grid 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField<PromotionFormData>
            name="bookmaker"
            label="Casa de apuestas"
            options={bookmakerOptions}
            required
          />
          <SelectField<PromotionFormData>
            name="cardinality"
            label="Tipo de promoción"
            options={promotionCardinalityOptions}
            onValueChange={onSinglePhaseChange}
            required
          />
          <SelectField<PromotionFormData>
            name="activationMethod"
            label="Método de activación"
            options={activationMethodOptions}
          />
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <SelectField<PromotionFormData>
              name="status"
              label="Estado"
              options={promotionStatusOptions}
            />
            <DateTimeField<PromotionFormData>
              name="statusDate"
              label="Fecha del estado"
              tooltip="Fecha en la que la promoción cambió a este estado"
            />
          </div>
        </div>

        {/* Fila 2: Nombre */}
        <InputField<PromotionFormData>
          name="name"
          label="Nombre"
          onValueChange={onNameChange}
          required
        />

        {/* Fila 3: Descripción */}
        <TextareaField<PromotionFormData>
          name="description"
          label="Descripción"
          rows={3}
          onValueChange={onDescriptionChange}
        />
        
      </div>
      
      {/* TimeframeForm también usa contexto ahora */}
      <TimeframeForm
        basePath="timeframe"
        title="Duración de la promoción"
        forceAbsolute={true}
        hideModeSelector={true}
      />
    </div>
  );
}