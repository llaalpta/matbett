"use client";

import { phaseStatusOptions, activationMethodOptions, rewardTypeOptions, getLabel, type AvailableTimeframes } from "@matbett/shared";
import React from "react";
import { useFormContext, useFieldArray, FieldArrayPath, Path, useWatch } from "react-hook-form";

import {
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyMuted,
} from "@/components/atoms";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { TextareaField } from "@/components/atoms/TextareaField";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PromotionFormData, RewardFormData, PhaseServerModel } from "@/types/hooks";
import { buildDefaultReward } from "@/utils/formDefaults";
import { useStatusDateSync } from "@/hooks/useStatusDateSync";

import { RewardForm } from "./RewardForm";
import { TimeframeForm } from "./TimeframeForm";
import { DateTimeField } from "../atoms";

interface PhaseFormProps {
  fieldPath: string; // ej: "phases.0"
  onRemove?: () => void;
  isSimplified?: boolean;
  isEditing?: boolean;
  // Props explícitas para tracking
  onRewardSelect?: (id: string, index: number) => void;
  onQualifyConditionSelect?: (id: string, index: number) => void;
  availableTimeframes?: AvailableTimeframes;
  phaseServerData?: PhaseServerModel; // Datos del servidor para esta fase
}

export const PhaseForm: React.FC<PhaseFormProps> = ({
  fieldPath,
  onRemove,
  isSimplified = false,
  isEditing = false,
  onRewardSelect,
  onQualifyConditionSelect,
  availableTimeframes,
  phaseServerData,
}) => {
  // 1. Obtener contexto del formulario
  const { control, getValues, setValue } = useFormContext<PromotionFormData>();

  const fieldPrefix = `${fieldPath}.`;

  // 2. Field Array de Rewards
  const rewardsFieldArray = useFieldArray({
    control,
    name: `${fieldPrefix}rewards` as FieldArrayPath<PromotionFormData>,
  });

  // Watch rewards to get types for tabs labels
  const rewardsValues = useWatch({
    control,
    name: `${fieldPrefix}rewards` as Path<PromotionFormData>,
  });

  // Sincronizar fechas de estado para la fase
  useStatusDateSync({
    control,
    setValue,
    statusPath: `${fieldPrefix}status` as Path<PromotionFormData>,
    datePath: `${fieldPrefix}statusDate` as Path<PromotionFormData>,
    serverDates: phaseServerData,
  });

  const addReward = (type: string = "FREEBET") => {
    rewardsFieldArray.append(buildDefaultReward(type));
  };

  const removeReward = (rewardIndex: number) => {
    rewardsFieldArray.remove(rewardIndex);
  };

  // Handler para cambio de tab de reward (usa la prop recibida)
  const handleRewardTabChange = (value: string) => {
    const rewardIndex = parseInt(value);
    const reward = getValues(`${fieldPrefix}rewards.${rewardIndex}` as Path<PromotionFormData>) as RewardFormData;
    
    if (reward?.id && onRewardSelect) {
      onRewardSelect(reward.id, rewardIndex);
    }
  };

  // Helper para renderizar RewardForm (DRY)
  const renderRewardForm = (index: number) => (
    <RewardForm<PromotionFormData>
      fieldPath={`${fieldPrefix}rewards.${index}` as Path<PromotionFormData>}
      onRemove={() => removeReward(index)}
      canRemove={!isSimplified || rewardsFieldArray.fields.length > 1}
      isEditing={isEditing}
      onQualifyConditionSelect={onQualifyConditionSelect}
      availableTimeframes={availableTimeframes}
      rewardServerData={phaseServerData?.rewards?.[index]} // Pasar datos del servidor en cascada
    />
  );

  // --- RENDERIZADO (MODO SIMPLIFICADO / FASE ÚNICA) ---
  if (isSimplified) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-1">
            <TypographyH4>Recompensas</TypographyH4>
            <span className="text-sm text-muted-foreground font-normal">
              {rewardsFieldArray.fields.length === 1 &&
                `${rewardsFieldArray.fields.length} recompensa configurada`}
              {rewardsFieldArray.fields.length > 1 &&
                `${rewardsFieldArray.fields.length} recompensas configuradas`}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addReward("FREEBET")}
          >
            + Añadir Recompensa
          </Button>
        </div>

        {rewardsFieldArray.fields.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <TypographyP>No hay recompensas configuradas.</TypographyP>
            <TypographyMuted>
              Añade al menos una recompensa para continuar.
            </TypographyMuted>
          </div>
        ) : rewardsFieldArray.fields.length === 1 ? (
          // Si solo hay una recompensa, mostrarla directamente sin tabs
          renderRewardForm(0)
        ) : (
          // Si hay más de una recompensa, mostrar con tabs
          <Tabs defaultValue="0" onValueChange={handleRewardTabChange}>
            <TabsList className="flex h-auto w-full flex-wrap gap-1 md:grid md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
              {rewardsFieldArray.fields.map((_, rewardIndex) => {
                const rewardType = (rewardsValues as any)?.[rewardIndex]?.type || "FREEBET";
                const label = getLabel(rewardTypeOptions, rewardType);
                return (
                  <TabsTrigger key={rewardIndex} value={rewardIndex.toString()}>
                    {label} ({rewardIndex + 1})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {rewardsFieldArray.fields.map((field, rewardIndex) => (
              <TabsContent key={field.id} value={rewardIndex.toString()}>
                {renderRewardForm(rewardIndex)}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    );
  }

  // --- RENDERIZADO (MODO COMPLETO / MÚLTIPLES FASES) ---
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TypographyH3>
          {fieldPath.includes("phases.")
            ? `Fase ${fieldPath.split(".")[1] ? parseInt(fieldPath.split(".")[1]) + 1 : 1}`
            : "Fase"}
        </TypographyH3>
        {onRemove && (
          <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
            Eliminar Fase
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <TypographyH4>Información básica</TypographyH4>

        <InputField<PromotionFormData>
          name={`${fieldPrefix}name` as Path<PromotionFormData>}
          label="Nombre de la fase"
          placeholder="Ej: Depósito inicial, Apuesta de calificación, etc."
          required
        />

        <TextareaField<PromotionFormData>
          name={`${fieldPrefix}description` as Path<PromotionFormData>}
          label="Descripción"
          placeholder="Describe qué debe hacer el usuario en esta fase"
          rows={3}
        />
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField<PromotionFormData>
            name={`${fieldPrefix}activationMethod` as Path<PromotionFormData>}
            label="Método de activación"
            options={activationMethodOptions}
            required
          />
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <SelectField<PromotionFormData>
              name={`${fieldPrefix}status` as Path<PromotionFormData>}
              label="Estado"
              options={phaseStatusOptions}
            />
            <DateTimeField<PromotionFormData>
              name={`${fieldPrefix}statusDate` as Path<PromotionFormData>}
              label="Fecha del estado"
              tooltip="Fecha en la que la fase cambió a este estado"
            />
          </div>
        </div>
      </div>

      <TimeframeForm<PromotionFormData>
        basePath={`${fieldPrefix}timeframe` as Path<PromotionFormData>}
        title="Duración de la fase"
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TypographyH4>Recompensas</TypographyH4>
          <Button type="button" variant="outline" size="sm" onClick={() => addReward("FREEBET")}>
            + Añadir Recompensa
          </Button>
        </div>
        
        {rewardsFieldArray.fields.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <TypographyP>No hay recompensas configuradas.</TypographyP>
            </div>
        ) : rewardsFieldArray.fields.length === 1 ? (
            renderRewardForm(0)
        ) : (
            <Tabs defaultValue="0" onValueChange={handleRewardTabChange}>
              <TabsList className="flex h-auto w-full flex-wrap gap-1 md:grid md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
                {rewardsFieldArray.fields.map((_, rewardIndex) => {
                  const rewardType = (rewardsValues as any)?.[rewardIndex]?.type || "FREEBET";
                  const label = getLabel(rewardTypeOptions, rewardType);
                  return (
                    <TabsTrigger key={rewardIndex} value={rewardIndex.toString()}>
                      {label} {rewardIndex + 1}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {rewardsFieldArray.fields.map((field, rewardIndex) => (
                <TabsContent key={field.id} value={rewardIndex.toString()}>
                  {renderRewardForm(rewardIndex)}
                </TabsContent>
              ))}
            </Tabs>
        )}
      </div>
    </div>
  );
};