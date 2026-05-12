"use client";

import {
  activationMethodOptions,
  claimMethodOptions,
  rewardTypeOptions,
  rewardValueTypeOptions,
  type AnchorCatalog,
  type AnchorOccurrences,
  type RewardType,
  type RewardValueType,
} from "@matbett/shared";
import { Trash2 } from "lucide-react";
import {
  FieldArrayPath,
  FieldValues,
  Path,
  useController,
  useFormContext,
} from "react-hook-form";

import {
  CheckboxField,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/atoms";
import { DateTimeField } from "@/components/atoms/DateTimeField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RewardFormData, RewardServerModel } from "@/types/hooks";
import {
  getUsageTypeBadgeVariant,
  getUsageTypeLabel,
} from "@/utils/usageTypeUtils";

import { UsageConditionsForm, type UsageConditionsFormPaths } from "./UsageConditionsForm";

const isRewardType = (value: string): value is RewardType =>
  rewardTypeOptions.some((option) => option.value === value);

const isRewardValueType = (value: string): value is RewardValueType =>
  rewardValueTypeOptions.some((option) => option.value === value);

type StatusSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
};

export interface RewardFormSharedProps {
  onRemove: () => void;
  canRemove?: boolean;
  removeDisabledReason?: string;
  isEditing?: boolean;
  rewardServerData?: RewardServerModel;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
  isRewardDefinitionReadOnly?: boolean;
  rewardDefinitionReadOnlyReason?: string;
  isUsageConditionsReadOnly?: boolean;
  usageConditionsReadOnlyReason?: string;
  rewardStatusOptions?: StatusSelectOption[];
  rewardWarnings?: string[];
}

export type RewardFormPaths<
  T extends FieldValues,
  P extends FieldArrayPath<T>,
> = {
  reward?: Path<T>;
  id: Path<T>;
  type: Path<T>;
  valueType: Path<T>;
  value: Path<T>;
  activationMethod: Path<T>;
  claimMethod: Path<T>;
  activationRestrictions: Path<T>;
  status: Path<T>;
  statusDate: Path<T>;
  claimRestrictions: Path<T>;
  withdrawalRestrictions: Path<T>;
  stakeNotReturned: Path<T>;
  retentionRate: Path<T>;
  qualifyConditions: P;
  usageConditions: Path<T>;
  usageConditionsType: Path<T>;
};

export interface RewardFormBaseProps<
  T extends FieldValues,
  P extends FieldArrayPath<T>,
  Paths extends RewardFormPaths<T, P>,
> extends RewardFormSharedProps {
  paths: Paths;
  usagePaths: UsageConditionsFormPaths<T>;
  rewardType?: string;
  valueType?: string;
  usageType?: string;
  onTypeChange: (value: RewardFormData["type"]) => void;
  onValueTypeChange: (value: RewardFormData["valueType"]) => void;
  rewardValueForAnalysis?: number;
  depositRequiredForAnalysis?: number;
}

export function RewardFormBase<
  T extends FieldValues,
  P extends FieldArrayPath<T>,
  Paths extends RewardFormPaths<T, P>,
>({
  paths,
  usagePaths,
  rewardType,
  valueType,
  usageType,
  onTypeChange,
  onValueTypeChange,
  onRemove,
  canRemove = false,
  removeDisabledReason,
  anchorCatalog,
  anchorOccurrences,
  isRewardDefinitionReadOnly = false,
  rewardDefinitionReadOnlyReason,
  isUsageConditionsReadOnly = false,
  usageConditionsReadOnlyReason,
  rewardStatusOptions,
  rewardWarnings,
  rewardValueForAnalysis,
  depositRequiredForAnalysis,
}: RewardFormBaseProps<T, P, Paths>) {
  const { control } = useFormContext<T>();
  const spinsCountController = useController({
    control,
    name: usagePaths.casinoSpins.spinsCount,
  });

  const rewardTypeValue: string =
    typeof rewardType === "string" ? rewardType : "FREEBET";
  const valueTypeValue: string =
    typeof valueType === "string" ? valueType : "FIXED";

  return (
    <div className="border-border/50 bg-card w-full space-y-4 rounded-lg border p-5 shadow-sm">
      {(canRemove || removeDisabledReason) && (
        <div className="flex justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!canRemove}
                  onClick={() => {
                    if (canRemove) {
                      onRemove();
                    }
                  }}
                  className={
                    canRemove
                      ? "text-destructive hover:text-destructive/90"
                      : "text-muted-foreground"
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar recompensa
                </Button>
              </span>
            </TooltipTrigger>
            {removeDisabledReason ? (
              <TooltipContent sideOffset={6}>
                {removeDisabledReason}
              </TooltipContent>
            ) : null}
          </Tooltip>
        </div>
      )}

      {rewardWarnings && rewardWarnings.length > 0 ? (
        <Alert className="border-amber-300 bg-amber-50/70 text-amber-900">
          <AlertDescription className="space-y-1 text-amber-900">
            {rewardWarnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      {isRewardDefinitionReadOnly && rewardDefinitionReadOnlyReason ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {rewardDefinitionReadOnlyReason}
        </div>
      ) : null}

      <fieldset disabled={isRewardDefinitionReadOnly} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField<T>
            name={paths.type}
            label="Tipo de recompensa"
            options={rewardTypeOptions}
            onValueChange={(value) => {
              if (isRewardType(value) && value !== rewardTypeValue) {
                if (value === "CASINO_SPINS") {
                  onValueTypeChange("FIXED");
                }
                onTypeChange(value);
              }
            }}
            required
          />

          <SelectField<T>
            name={paths.valueType}
            label="Tipo de valor"
            options={rewardValueTypeOptions}
            disabled={rewardTypeValue === "CASINO_SPINS"}
            onValueChange={(value) => {
              if (rewardTypeValue === "CASINO_SPINS") {
                onValueTypeChange("FIXED");
                return;
              }
              if (isRewardValueType(value)) {
                onValueTypeChange(value);
              }
            }}
            required
          />

          <InputField<T>
            name={paths.value}
            label={
              rewardTypeValue === "CASINO_SPINS"
                ? "Número de tiradas"
                : valueTypeValue === "FIXED"
                  ? "Valor de la recompensa (€)"
                  : "Valor calculado (€)"
            }
            type="number"
            min={rewardTypeValue === "CASINO_SPINS" ? 1 : 0}
            step={valueTypeValue === "FIXED" ? 1 : 0.01}
            placeholder={
              rewardTypeValue === "CASINO_SPINS"
                ? "ej: 50"
                : valueTypeValue === "FIXED"
                  ? "ej: 20"
                  : "Se calculará automáticamente"
            }
            disabled={valueTypeValue === "CALCULATED_FROM_CONDITIONS"}
            onValueChange={(value) => {
              if (
                rewardTypeValue === "CASINO_SPINS" &&
                typeof value === "number"
              ) {
                spinsCountController.field.onChange(value);
              }
            }}
            required
          />

          <SelectField<T>
            name={paths.activationMethod}
            label="Método de activación"
            options={activationMethodOptions}
            required
          />

          <SelectField<T>
            name={paths.claimMethod}
            label="Método de reclamación"
            options={claimMethodOptions}
            required
          />
        </div>

        <TextareaField<T>
          name={paths.activationRestrictions}
          label="Restricciones de activación"
          placeholder="Ej: Requiere verificación, opt-in o canje manual."
          rows={2}
        />

        <TextareaField<T>
          name={paths.claimRestrictions}
          label="Restricciones de reclamación"
          placeholder="Ej: Debe reclamarse en 48h; asignación manual en hasta 72h."
          rows={2}
        />

        <TextareaField<T>
          name={paths.withdrawalRestrictions}
          label="Restricciones de retirada de saldo"
          placeholder="Ej: Una retirada durante vigencia cancela bono/saldo promocional."
          rows={2}
        />

        {rewardTypeValue === "FREEBET" && (
          <div className="grid gap-4 md:grid-cols-2">
            <CheckboxField<T>
              name={paths.stakeNotReturned}
              label="Stake no devuelto (SNR)"
              tooltip="Al ganar con esta freebet, solo se recibe la ganancia neta, no el importe de la freebet."
            />
            <InputField<T>
              name={paths.retentionRate}
              type="number"
              label="Retention rate %"
              tooltip="Porcentaje esperado de conversión de la freebet para cálculos de matched betting."
              min={0}
              max={100}
              step={0.01}
              required
              treatZeroAsEmpty
            />
          </div>
        )}
      </fieldset>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <SelectField<T>
          name={paths.status}
          label="Estado"
          options={rewardStatusOptions ?? []}
          tooltip="Estado actual de la recompensa en su ciclo de vida"
        />
        <DateTimeField<T>
          name={paths.statusDate}
          label="Fecha del cambio de estado"
          tooltip="Fecha en la que la recompensa cambió a este estado"
        />
      </div>

      <Separator />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">Condiciones de uso</h3>
          {usageType ? (
            <Badge variant={getUsageTypeBadgeVariant(String(usageType))}>
              {getUsageTypeLabel(String(usageType))}
            </Badge>
          ) : null}
        </div>

        {isUsageConditionsReadOnly && usageConditionsReadOnlyReason ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {usageConditionsReadOnlyReason}
          </div>
        ) : null}

        <fieldset disabled={isUsageConditionsReadOnly}>
          <UsageConditionsForm<T>
            paths={usagePaths}
            anchorCatalog={anchorCatalog}
            anchorOccurrences={anchorOccurrences}
            rewardValueForAnalysis={rewardValueForAnalysis}
            depositRequiredForAnalysis={depositRequiredForAnalysis}
          />
        </fieldset>
      </section>
    </div>
  );
}
