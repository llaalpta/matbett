"use client";

import {
  qualifyConditionStatusOptions,
  type QualifyConditionType,
  type AnchorCatalog,
  type AnchorOccurrences,
} from "@matbett/shared";
import { Trash2 } from "lucide-react";
import { FieldValues, Path, useFormContext } from "react-hook-form";

import { SelectField, SwitchField, TextareaField } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQualifyConditionLogic } from "@/hooks/domain/useQualifyConditionLogic";

import {
  DepositCondition,
  type DepositConditionPaths,
  QualifyBetCondition,
  type QualifyBetConditionPaths,
  LossesCashbackCondition,
  type LossesCashbackConditionPaths,
} from "./conditions";
import { TimeframeForm, type TimeframePaths } from "./TimeframeForm";

export interface QualifyConditionFormPaths<T extends FieldValues> {
  basePath: Path<T> | "";
  type: Path<T>;
  status: Path<T>;
  description: Path<T>;
  otherRestrictions: Path<T>;
  timeframe: TimeframePaths<T>;
  contributesToRewardValue: Path<T>;
  deposit: DepositConditionPaths<T>;
  bet: QualifyBetConditionPaths<T>;
  lossesCashback: LossesCashbackConditionPaths<T>;
}

interface QualifyConditionFormProps<T extends FieldValues> {
  paths: QualifyConditionFormPaths<T>;
  rewardType?: string;
  onRemove: () => void;
  canRemove?: boolean;
  removeDisabledReason?: string;
  rewardValueType?: string;
  rewardHasContributingCondition?: boolean;
  isEditing?: boolean;
  onViewTracking?: () => void;
  onTypeChange?: (newType: QualifyConditionType) => void;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
}

export function QualifyConditionForm<T extends FieldValues>({
  paths,
  rewardType,
  onRemove,
  canRemove = false,
  removeDisabledReason,
  rewardValueType,
  rewardHasContributingCondition = false,
  isEditing = false,
  onViewTracking,
  onTypeChange,
  anchorCatalog,
  anchorOccurrences,
}: QualifyConditionFormProps<T>) {
  const { control, watch } = useFormContext<T>();
  const { getValidConditionType, conditionType, availableConditionOptions } =
    useQualifyConditionLogic({
      typePath: paths.type,
      rewardType,
    });
  const contributesToRewardValue = watch(paths.contributesToRewardValue);

  return (
    <div className="space-y-4">
      {(canRemove || removeDisabledReason) && (
        <div className="flex items-center justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!canRemove}
                  onClick={() => {
                    if (!canRemove) {
                      return;
                    }
                    onRemove();
                  }}
                  className={
                    canRemove
                      ? "text-destructive hover:text-destructive/90"
                      : "text-muted-foreground"
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar condicion de calificacion
                </Button>
              </span>
            </TooltipTrigger>
            {removeDisabledReason ? (
              <TooltipContent sideOffset={6}>{removeDisabledReason}</TooltipContent>
            ) : null}
          </Tooltip>
        </div>
      )}

      {(conditionType === "DEPOSIT" || conditionType === "BET") &&
      rewardValueType === "CALCULATED_FROM_CONDITIONS" ? (
        <SwitchField<T>
          control={control}
          name={paths.contributesToRewardValue}
          label="El valor de la reward depende de esta condicion"
          description={
            contributesToRewardValue || !rewardHasContributingCondition
              ? conditionType === "DEPOSIT"
                ? "Si esta activado, el valor se calcula segun el deposito realizado."
                : conditionType === "BET"
                  ? "Si esta activado, el valor se calcula segun la apuesta realizada."
                  : "Si esta activado, el valor se calcula segun la condicion de calificacion."
              : "Otra condicion ya esta marcada para calcular el valor."
          }
          disabled={!contributesToRewardValue && rewardHasContributingCondition}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField<T>
          control={control}
          name={paths.type}
          label="Tipo de condicion"
          options={availableConditionOptions}
          placeholder="Seleccionar tipo de condicion"
          onValueChange={(value) => {
            const validType = getValidConditionType(value);
            if (!validType) {
              return;
            }
            onTypeChange?.(validType);
          }}
          required
        />
        <SelectField<T>
          control={control}
          name={paths.status}
          label="Estado"
          options={qualifyConditionStatusOptions}
        />
      </div>

      <TextareaField<T>
        control={control}
        name={paths.description}
        label="Descripcion"
        placeholder="Describe brevemente esta condicion de calificacion..."
        rows={2}
      />

      <TimeframeForm<T>
        paths={paths.timeframe}
        title="Periodo de calificacion"
        forceAbsolute={false}
        hideModeSelector={false}
        anchorCatalog={anchorCatalog}
        anchorOccurrences={anchorOccurrences}
        dependencySubjectLabel="Esta condicion de calificacion"
      />

      {conditionType === "DEPOSIT" ? (
        <DepositCondition<T>
          control={control}
          paths={paths.deposit}
          isEditing={isEditing}
          onViewTracking={onViewTracking}
        />
      ) : null}

      {conditionType === "BET" ? (
        <QualifyBetCondition<T> control={control} paths={paths.bet} />
      ) : null}

      {conditionType === "LOSSES_CASHBACK" ? (
        <LossesCashbackCondition<T> control={control} paths={paths.lossesCashback} />
      ) : null}

      {conditionType === "DEPOSIT" ? (
        <TextareaField<T>
          control={control}
          name={paths.otherRestrictions}
          label="Otras restricciones"
          placeholder="Ej: Solo nuevos usuarios, excluir ciertos juegos, etc."
          rows={2}
          tooltip="Restricciones adicionales no cubiertas por los campos especificos"
        />
      ) : null}
    </div>
  );
}
