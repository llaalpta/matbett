"use client";

import {
  type QualifyConditionType,
  type AnchorCatalog,
  type AnchorOccurrences,
} from "@matbett/shared";
import { Trash2 } from "lucide-react";
import { FieldValues, Path, useFormContext } from "react-hook-form";

import { SelectField, SwitchField, TextareaField } from "@/components/atoms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQualifyConditionAccessLogic } from "@/hooks/domain/qualifyConditions/useQualifyConditionAccessLogic";
import { useQualifyConditionLogic } from "@/hooks/domain/qualifyConditions/useQualifyConditionLogic";
import type { PromotionServerModel, RewardServerModel } from "@/types/hooks";
import type { RewardQualifyConditionServerModel } from "@/types/hooks";

import { BetEntryLauncherCard } from "./bets/BetEntryLauncherCard";
import {
  DepositCondition,
  type DepositConditionPaths,
  QualifyBetCondition,
  type QualifyBetConditionPaths,
  LossesCashbackCondition,
  type LossesCashbackConditionPaths,
} from "./conditions";
import { TimeframeForm, type TimeframePaths } from "./TimeframeForm";

const hasRecordKey = (
  value: unknown,
  key: string,
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  key in value;

const getNestedValue = (value: unknown, path: string): unknown => {
  if (!path) {
    return value;
  }

  return path.split(".").reduce<unknown>((current, key) => {
    if (!hasRecordKey(current, key)) {
      return undefined;
    }
    return current[key];
  }, value);
};

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
  conditionId?: string;
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
  promotionTimeframe?: unknown;
  promotion?: PromotionServerModel | null;
  conditionServerData?: RewardQualifyConditionServerModel;
  rewardStatus?: RewardServerModel["status"] | string;
  promotionStatus?: NonNullable<PromotionServerModel>["status"] | string;
  phaseStatus?: NonNullable<PromotionServerModel>["phases"][number]["status"] | string;
  readOnly?: boolean;
  readOnlyReason?: string;
  showBetEntryLauncher?: boolean;
}

export function QualifyConditionForm<T extends FieldValues>({
  paths,
  rewardType,
  conditionId,
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
  promotionTimeframe,
  promotion,
  conditionServerData,
  rewardStatus,
  promotionStatus,
  phaseStatus,
  readOnly = false,
  readOnlyReason,
  showBetEntryLauncher = false,
}: QualifyConditionFormProps<T>) {
  const { control, watch } = useFormContext<T>();
  const formValues = watch();
  const { getValidConditionType, conditionType, availableConditionOptions } =
    useQualifyConditionLogic({
      typePath: paths.type,
      rewardType,
    });
  const currentStatus = watch(paths.status);
  const timeframe = getNestedValue(
    formValues,
    paths.basePath === "" ? "timeframe" : `${paths.basePath}.timeframe`,
  );
  const contributesToRewardValue = watch(paths.contributesToRewardValue);
  const allowRetriesValue = watch(paths.bet.allowRetries);
  const maxAttemptsValue = watch(paths.bet.maxAttempts);
  const currentAttempts =
    conditionServerData?.type === "BET" && conditionServerData.tracking?.type === "BET"
      ? conditionServerData.tracking.currentAttempts
      : undefined;
  const qualifyConditionAccess = useQualifyConditionAccessLogic({
    isPersisted: Boolean(conditionId),
    conditionId,
    conditionType,
    conditionStatus: typeof currentStatus === "string" ? currentStatus : undefined,
    promotion: promotion ?? null,
    timeframe,
    promotionTimeframe: promotionTimeframe ?? promotion?.timeframe,
    anchorOccurrences,
    allowRetries: typeof allowRetriesValue === "boolean" ? allowRetriesValue : undefined,
    maxAttempts:
      typeof maxAttemptsValue === "number" ? maxAttemptsValue : undefined,
    currentAttempts,
    rewardStatus,
    promotionStatus,
    phaseStatus,
  });
  const definitionReadOnly = readOnly || !qualifyConditionAccess.isDefinitionEditable;
  const definitionReadOnlyReason =
    readOnlyReason ?? qualifyConditionAccess.definitionLockedReason;
  const statusReadOnly = readOnly || !qualifyConditionAccess.canEditStatus;
  const statusReadOnlyReason =
    readOnlyReason ?? qualifyConditionAccess.statusLockedReason;

  return (
    <div className="space-y-4">
      {qualifyConditionAccess.warnings.length > 0 ? (
        <Alert className="border-amber-300 bg-amber-50/70 text-amber-900">
          <AlertDescription className="space-y-1 text-amber-900">
            {qualifyConditionAccess.warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      {showBetEntryLauncher && qualifyConditionAccess.canLaunchBetEntry ? (
        <BetEntryLauncherCard
          title="Registro contextual de apuestas"
          description="Abre el formulario de bets con esta qualify condition ya preseleccionada."
          actionLabel="Registrar apuesta para esta condición"
          href={conditionId ? `/bets/new/from-qualify-condition/${conditionId}` : undefined}
          disabledReason={qualifyConditionAccess.betEntryDisabledReason}
        />
      ) : null}

      {(canRemove || removeDisabledReason) && (
        <div className="flex items-center justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!canRemove || definitionReadOnly}
                  onClick={() => {
                    if (!canRemove || definitionReadOnly) {
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
            {removeDisabledReason || definitionReadOnlyReason ? (
              <TooltipContent sideOffset={6}>
                {definitionReadOnlyReason ?? removeDisabledReason}
              </TooltipContent>
            ) : null}
          </Tooltip>
        </div>
      )}

      {definitionReadOnly && definitionReadOnlyReason ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {definitionReadOnlyReason}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField<T>
          control={control}
          name={paths.status}
          label="Estado"
          options={qualifyConditionAccess.statusOptions}
          disabled={statusReadOnly}
          tooltip={statusReadOnlyReason}
        />
      </div>

      <fieldset disabled={definitionReadOnly} className="space-y-4">
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

      </fieldset>

      {conditionType === "DEPOSIT" ? (
        <DepositCondition<T>
          control={control}
          paths={paths.deposit}
          isEditing={isEditing}
          onViewTracking={onViewTracking}
          readOnly={definitionReadOnly}
        />
      ) : null}

      {conditionType === "BET" ? (
        <fieldset disabled={definitionReadOnly}>
          <QualifyBetCondition<T> control={control} paths={paths.bet} />
        </fieldset>
      ) : null}

      {conditionType === "LOSSES_CASHBACK" ? (
        <fieldset disabled={definitionReadOnly}>
          <LossesCashbackCondition<T> control={control} paths={paths.lossesCashback} />
        </fieldset>
      ) : null}

      {conditionType === "DEPOSIT" ? (
        <fieldset disabled={definitionReadOnly}>
          <TextareaField<T>
            control={control}
            name={paths.otherRestrictions}
            label="Otras restricciones"
            placeholder="Ej: Solo nuevos usuarios, excluir ciertos juegos, etc."
            rows={2}
            tooltip="Restricciones adicionales no cubiertas por los campos especificos"
          />
        </fieldset>
      ) : null}
    </div>
  );
}
