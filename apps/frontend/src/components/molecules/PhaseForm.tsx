"use client";

import { phaseStatusOptions, activationMethodOptions, rewardTypeOptions, getLabel, type AnchorCatalog, type AnchorOccurrences } from "@matbett/shared";
import { Trash2 } from "lucide-react";
import React, { useCallback, useState } from "react";

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePhaseLogic } from "@/hooks/domain/usePhaseLogic";
import type { PromotionFormData, PhaseServerModel } from "@/types/hooks";

import { DateTimeField } from "../atoms";

import { RewardForm } from "./RewardForm";
import { TimeframeForm } from "./TimeframeForm";

interface PhaseFormProps {
  phaseIndex: number;
  onRemove?: () => void;
  removeDisabledReason?: string;
  isSimplified?: boolean;
  isEditing?: boolean;
  // Props explícitas para tracking
  onRewardSelect?: (id: string, index: number) => void;
  onQualifyConditionSelect?: (id: string, index: number) => void;
  availableQualifyConditions?: Array<{
    id: string;
    type: string;
    description?: string | null;
  }>;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
  phaseServerData?: PhaseServerModel; // Datos del servidor para esta fase
}

export const PhaseForm: React.FC<PhaseFormProps> = ({
  phaseIndex,
  onRemove,
  removeDisabledReason,
  isSimplified = false,
  isEditing = false,
  onRewardSelect,
  onQualifyConditionSelect,
  availableQualifyConditions,
  anchorCatalog,
  anchorOccurrences,
  phaseServerData,
}) => {
  const {
    rewardsFieldArray,
    rewardsValues,
    addReward,
    removeReward,
    canRemoveReward,
    getRewardRemoveDisabledReason,
    getRewardIdByIndex,
    getRewardFieldPath,
    namePath,
    descriptionPath,
    activationMethodPath,
    statusPath,
    statusDatePath,
    timeframePaths,
  } = usePhaseLogic({
    phaseIndex,
    phaseServerData,
  });
  const [rewardTabIndex, setRewardTabIndex] = useState(0);
  const activeRewardTabIndex = Math.min(
    rewardTabIndex,
    Math.max(rewardsFieldArray.fields.length - 1, 0)
  );

  const handleRemoveReward = useCallback(
    (rewardIndex: number) => {
      setRewardTabIndex((current) => {
        const nextLength = rewardsFieldArray.fields.length - 1;
        if (nextLength <= 0) {
          return 0;
        }
        if (rewardIndex < current) {
          return current - 1;
        }
        if (rewardIndex === current) {
          return Math.min(current, nextLength - 1);
        }
        return current;
      });
      removeReward(rewardIndex);
    },
    [removeReward, rewardsFieldArray.fields.length]
  );

  const handleRewardTabChange = useCallback(
    (value: string) => {
      const rewardIndex = Number.parseInt(value, 10);
      if (Number.isNaN(rewardIndex)) {
        return;
      }
      setRewardTabIndex(rewardIndex);
      if (!onRewardSelect) {
        return;
      }
      const rewardId = getRewardIdByIndex(rewardIndex);
      if (!rewardId) {
        return;
      }
      onRewardSelect(rewardId, rewardIndex);
    },
    [getRewardIdByIndex, onRewardSelect]
  );

  // Helper para renderizar RewardForm (DRY)
  const renderRewardForm = (index: number) => {
    const rewardPath = getRewardFieldPath(index);
    const rewardRemoveDisabledReason = getRewardRemoveDisabledReason(index);
    const canRemoveCurrentReward = canRemoveReward(index, isSimplified);

    return (
      <RewardForm
        fieldPath={rewardPath}
        onRemove={() => handleRemoveReward(index)}
        canRemove={canRemoveCurrentReward}
        removeDisabledReason={rewardRemoveDisabledReason}
        isEditing={isEditing}
        onQualifyConditionSelect={onQualifyConditionSelect}
        availableQualifyConditions={availableQualifyConditions}
        anchorCatalog={anchorCatalog}
        anchorOccurrences={anchorOccurrences}
        rewardServerData={phaseServerData?.rewards?.[index]} // Pasar datos del servidor en cascada
      />
    );
  };

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
          <Tabs
            value={activeRewardTabIndex.toString()}
            onValueChange={handleRewardTabChange}
          >
            <TabsList className="flex h-auto w-full flex-wrap gap-1 md:grid md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
              {rewardsFieldArray.fields.map((_, rewardIndex) => {
                const rewardType = rewardsValues?.[rewardIndex]?.type ?? "FREEBET";
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
          {`Fase ${phaseIndex + 1}`}
        </TypographyH3>
        {(onRemove || removeDisabledReason) ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!onRemove}
                  onClick={() => {
                    if (!onRemove) {
                      return;
                    }
                    onRemove();
                  }}
                  className={
                    onRemove
                      ? "text-destructive hover:text-destructive/90"
                      : "text-muted-foreground"
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar fase
                </Button>
              </span>
            </TooltipTrigger>
            {removeDisabledReason ? (
              <TooltipContent sideOffset={6}>{removeDisabledReason}</TooltipContent>
            ) : null}
          </Tooltip>
        ) : null}
      </div>

      <div className="space-y-4">
        <TypographyH4>Información básica</TypographyH4>

        <InputField<PromotionFormData>
          name={namePath}
          label="Nombre de la fase"
          placeholder="Ej: Depósito inicial, Apuesta de calificación, etc."
          required
        />

        <TextareaField<PromotionFormData>
          name={descriptionPath}
          label="Descripción"
          placeholder="Describe qué debe hacer el usuario en esta fase"
          rows={3}
        />
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField<PromotionFormData>
            name={activationMethodPath}
            label="Método de activación"
            options={activationMethodOptions}
            required
          />
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <SelectField<PromotionFormData>
              name={statusPath}
              label="Estado"
              options={phaseStatusOptions}
            />
            <DateTimeField<PromotionFormData>
              name={statusDatePath}
              label="Fecha del cambio de estado"
              tooltip="Fecha en la que la fase cambió a este estado"
            />
          </div>
        </div>
      </div>

      <TimeframeForm<PromotionFormData>
        paths={timeframePaths}
        anchorCatalog={anchorCatalog}
        anchorOccurrences={anchorOccurrences}
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
            <Tabs
              value={activeRewardTabIndex.toString()}
              onValueChange={handleRewardTabChange}
            >
              <TabsList className="flex h-auto w-full flex-wrap gap-1 md:grid md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
                {rewardsFieldArray.fields.map((_, rewardIndex) => {
                  const rewardType = rewardsValues?.[rewardIndex]?.type ?? "FREEBET";
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


