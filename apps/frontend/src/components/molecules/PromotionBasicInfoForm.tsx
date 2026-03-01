"use client";

import {
  activationMethodOptions,
  bookmakerOptions,
  promotionCardinalityOptions,
  promotionStatusOptions,
} from "@matbett/shared";
import { useFormContext } from "react-hook-form";

import { DateTimeField } from "@/components/atoms/DateTimeField";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { TextareaField } from "@/components/atoms/TextareaField";
import { usePromotionStatusDateSync } from "@/hooks/useStatusDateSync";
import type { PromotionFormData, PromotionServerModel } from "@/types/hooks";

interface PromotionBasicInfoFormProps {
  onSinglePhaseChange?: (value: PromotionFormData["cardinality"]) => void;
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
  const { control, setValue } = useFormContext<PromotionFormData>();

  usePromotionStatusDateSync({
    control,
    setValue,
    statusPath: "status",
    datePath: "statusDate",
    serverDates: serverData
      ? {
          activatedAt: serverData.activatedAt ?? null,
          completedAt: serverData.completedAt ?? null,
          expiredAt: serverData.expiredAt ?? null,
        }
      : undefined,
  });

  const handleSinglePhaseChange = (value: string) => {
    if (value === "SINGLE" || value === "MULTIPLE") {
      onSinglePhaseChange?.(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField<PromotionFormData>
            name="bookmaker"
            label="Casa de apuestas de la promoción (Bookmaker)"
            options={bookmakerOptions}
            required
          />
          <SelectField<PromotionFormData>
            name="cardinality"
            label="Tipo de promoción"
            options={promotionCardinalityOptions}
            onValueChange={handleSinglePhaseChange}
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
              label="Fecha del cambio de estado"
              tooltip="Fecha en la que la promoción cambió a este estado"
            />
          </div>
        </div>

        <InputField<PromotionFormData>
          name="name"
          label="Nombre"
          onValueChange={onNameChange}
          required
        />

        <TextareaField<PromotionFormData>
          name="description"
          label="Descripción"
          rows={3}
          onValueChange={onDescriptionChange}
        />
      </div>

      <div className="space-y-2 rounded-md border border-border/40 bg-muted/20 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateTimeField<PromotionFormData>
            name="timeframe.start"
            label="Fecha de inicio de la promoción"
            required
          />
          <DateTimeField<PromotionFormData>
            name="timeframe.end"
            label="Fecha de finalización de la promoción"
          />
        </div>
      </div>
    </div>
  );
}
