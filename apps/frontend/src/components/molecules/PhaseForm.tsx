"use client";

import { activationMethodOptions, type AnchorCatalog, type AnchorOccurrences } from "@matbett/shared";
import { Trash2 } from "lucide-react";
import React from "react";

import {
  TypographyH3,
  TypographyH4,
} from "@/components/atoms";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { TextareaField } from "@/components/atoms/TextareaField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePhaseAccessLogic } from "@/hooks/domain/promotions/usePhaseAccessLogic";
import { usePhaseLogic } from "@/hooks/domain/promotions/usePhaseLogic";
import type { PromotionFormData, PhaseServerModel } from "@/types/hooks";

import { DateTimeField } from "../atoms";

import { PhaseRewardsTable } from "./promotions/PhaseRewardsTable";
import { TimeframeForm } from "./TimeframeForm";

interface PhaseFormProps {
  phaseIndex: number;
  onRemove?: () => void;
  removeDisabledReason?: string;
  isSimplified?: boolean;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
  phaseServerData?: PhaseServerModel; // Datos del servidor para esta fase
  promotionId?: string;
}

export const PhaseForm: React.FC<PhaseFormProps> = ({
  phaseIndex,
  onRemove,
  removeDisabledReason,
  isSimplified = false,
  anchorCatalog,
  anchorOccurrences,
  phaseServerData,
  promotionId,
}) => {
  const {
    rewardsValues,
    promotionStatus,
    promotionTimeframe,
    phaseStatusValue,
    phaseTimeframe,
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
  const phaseAccess = usePhaseAccessLogic({
    isPersisted: Boolean(phaseServerData?.id),
    promotionStatus:
      typeof promotionStatus === "string" ? promotionStatus : undefined,
    phaseStatus:
      typeof phaseStatusValue === "string" ? phaseStatusValue : undefined,
    timeframe: phaseTimeframe,
    promotionTimeframe,
    anchorOccurrences,
    rewards: rewardsValues,
  });
  const rewards = phaseServerData?.rewards ?? [];
  const canAddReward =
    Boolean(promotionId && phaseServerData?.id) && phaseAccess.isStructureEditable;
  const addRewardDisabledReason =
    !phaseServerData?.id
      ? "Guarda la promoción primero para añadir recompensas a esta fase."
      : phaseAccess.structureLockedReason;

  const renderRewardsSection = () => (
    <PhaseRewardsTable
      rewards={rewards}
      phaseId={phaseServerData?.id}
      promotionId={promotionId}
      canAddReward={canAddReward}
      addRewardDisabledReason={addRewardDisabledReason}
    />
  );

  return (
    <div className="space-y-4">
      {phaseAccess.warnings.length > 0 ? (
        <Alert className="border-amber-300 bg-amber-50/70 text-amber-900">
          <AlertDescription className="space-y-1 text-amber-900">
            {phaseAccess.warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      {!phaseAccess.isStructureEditable && phaseAccess.structureLockedReason ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {phaseAccess.structureLockedReason}
        </div>
      ) : null}

      {!isSimplified ? (
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
                  disabled={!onRemove || !phaseAccess.isStructureEditable}
                  onClick={() => {
                    if (!onRemove || !phaseAccess.isStructureEditable) {
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
      ) : (
        <TypographyH3>Fase principal</TypographyH3>
      )}

      <fieldset disabled={!phaseAccess.isStructureEditable} className="space-y-4">
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
        </div>
      </fieldset>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <SelectField<PromotionFormData>
          name={statusPath}
          label="Estado"
          options={phaseAccess.statusOptions}
        />
        <DateTimeField<PromotionFormData>
          name={statusDatePath}
          label="Fecha del cambio de estado"
          tooltip="Fecha en la que la fase cambió a este estado"
        />
      </div>

      <fieldset disabled={!phaseAccess.isStructureEditable}>
        <TimeframeForm<PromotionFormData>
          paths={timeframePaths}
          anchorCatalog={anchorCatalog}
          anchorOccurrences={anchorOccurrences}
          title="Duración de la fase"
        />
      </fieldset>

      <div className="space-y-4">
        {renderRewardsSection()}
      </div>
    </div>
  );
};


