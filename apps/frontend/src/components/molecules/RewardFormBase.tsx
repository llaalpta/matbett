"use client";

import {
  activationMethodOptions,
  rewardTypeOptions,
  rewardValueTypeOptions,
  claimMethodOptions,
  qualifyConditionTypeOptions,
  getLabel,
  type AnchorCatalog,
  type AnchorOccurrences,
  type RewardType,
  type RewardValueType,
  type QualifyConditionType,
} from "@matbett/shared";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, Trash2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  FieldArrayPath,
  FieldValues,
  Path,
  useController,
  useFormContext,
  useWatch,
} from "react-hook-form";

import {
  CheckboxField,
  InputField,
  SelectField,
  TextareaField,
  TypographyLarge,
} from "@/components/atoms";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { DateTimeField } from "@/components/atoms/DateTimeField";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  PromotionServerModel,
  RewardFormData,
  RewardServerModel,
} from "@/types/hooks";
import {
  getUsageTypeBadgeVariant,
  getUsageTypeLabel,
} from "@/utils/usageTypeUtils";

import { BetEntryLauncherCard } from "./bets/BetEntryLauncherCard";
import { QualifyConditionForm, type QualifyConditionFormPaths } from "./QualifyConditionForm";
import { QualifyConditionPickerDialog } from "./QualifyConditionPickerDialog";
import { UsageConditionsForm, type UsageConditionsFormPaths } from "./UsageConditionsForm";
import { UsageTrackingForm } from "./UsageTrackingForm";

const isRewardType = (value: string): value is RewardType =>
  rewardTypeOptions.some((option) => option.value === value);

const isRewardValueType = (value: string): value is RewardValueType =>
  rewardValueTypeOptions.some((option) => option.value === value);

type QualifyConditionSelectOption = {
  id: string;
  type: string;
  description?: string | null;
};

type QualifyConditionDraftValue = {
  id?: string;
  clientId?: string;
  type?: string;
  conditions?: unknown;
};

const hasPersistedId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

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
  onQualifyConditionSelect?: (id: string, index: number) => void;
  enableQualifyConditionDirectOpen?: boolean;
  availableQualifyConditions?: QualifyConditionSelectOption[];
  onAddExistingQualifyCondition?: (conditionId: string) => void;
  rewardServerData?: RewardServerModel;
  promotion?: PromotionServerModel | null;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
  promotionTimeframe?: unknown;
  isRewardDefinitionReadOnly?: boolean;
  rewardDefinitionReadOnlyReason?: string;
  areQualifyConditionsReadOnly?: boolean;
  qualifyConditionsReadOnlyReason?: string;
  isUsageConditionsReadOnly?: boolean;
  usageConditionsReadOnlyReason?: string;
  rewardStatusOptions?: StatusSelectOption[];
  rewardWarnings?: string[];
  promotionStatus?: string;
  phaseStatus?: string;
  showQualifyConditionsSection?: boolean;
  showBetEntryLauncher?: boolean;
  rewardBetEntryHref?: string;
  rewardBetEntryDisabledReason?: string;
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
  getQualifyConditionPaths: (index: number) => QualifyConditionFormPaths<T>;
  usagePaths: UsageConditionsFormPaths<T>;
  rewardType?: string;
  valueType?: string;
  usageType?: string;
  qualifyConditions: Array<{ id: string }>;
  qualifyConditionsValues?: QualifyConditionDraftValue[];
  onTypeChange: (value: RewardFormData["type"]) => void;
  onValueTypeChange: (value: RewardFormData["valueType"]) => void;
  onAddQualifyCondition: () => void;
  onRemoveQualifyCondition: (index: number) => void;
  onQualifyConditionTypeChange: (
    index: number,
    type: QualifyConditionType
  ) => void;
  getQualifyConditionRemoveDisabledReason: (index: number) => string | undefined;
  canRemoveQualifyCondition: (index: number) => boolean;
  rewardHasContributingCondition: boolean;
}

export function RewardFormBase<
  T extends FieldValues,
  P extends FieldArrayPath<T>,
  Paths extends RewardFormPaths<T, P>,
>({
  paths,
  getQualifyConditionPaths,
  usagePaths,
  rewardType,
  valueType,
  usageType,
  qualifyConditions,
  qualifyConditionsValues,
  onTypeChange,
  onValueTypeChange,
  onAddQualifyCondition,
  onRemoveQualifyCondition,
  onQualifyConditionTypeChange,
  getQualifyConditionRemoveDisabledReason,
  canRemoveQualifyCondition,
  rewardHasContributingCondition,
  onRemove,
  canRemove = false,
  removeDisabledReason,
  isEditing = false,
  onQualifyConditionSelect,
  enableQualifyConditionDirectOpen = false,
  availableQualifyConditions,
  onAddExistingQualifyCondition,
  rewardServerData,
  promotion,
  anchorCatalog,
  anchorOccurrences,
  promotionTimeframe,
  isRewardDefinitionReadOnly = false,
  rewardDefinitionReadOnlyReason,
  areQualifyConditionsReadOnly = false,
  qualifyConditionsReadOnlyReason,
  isUsageConditionsReadOnly = false,
  usageConditionsReadOnlyReason,
  rewardStatusOptions,
  rewardWarnings,
  promotionStatus,
  phaseStatus,
  showQualifyConditionsSection = true,
  showBetEntryLauncher = false,
  rewardBetEntryHref,
  rewardBetEntryDisabledReason,
}: RewardFormBaseProps<T, P, Paths>) {
  const { control, setValue } = useFormContext<T>();
  const spinsCountController = useController({
    control,
    name: usagePaths.casinoSpins.spinsCount,
  });
  const [isExistingConditionPickerOpen, setIsExistingConditionPickerOpen] =
    useState(false);
  const [pendingRewardType, setPendingRewardType] = useState<RewardType>();
  const [showRewardTypeConfirmDialog, setShowRewardTypeConfirmDialog] =
    useState(false);
  const [qualifyConditionTabIndex, setQualifyConditionTabIndex] = useState(0);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  const selectableExistingConditions = useMemo(() => {
    if (!availableQualifyConditions || availableQualifyConditions.length === 0) {
      return [];
    }
    const usedConditionIds = new Set(
      qualifyConditionsValues
        ?.map((condition) =>
          typeof condition?.id === "string" && condition.id.length > 0
            ? condition.id
            : undefined
        )
        .filter(Boolean) ?? []
    );
    return availableQualifyConditions.filter(
      (condition) => !usedConditionIds.has(condition.id)
    );
  }, [availableQualifyConditions, qualifyConditionsValues]);

  const activeQualifyConditionTabIndex = Math.min(
    qualifyConditionTabIndex,
    Math.max(qualifyConditions.length - 1, 0)
  );

  const handleQualifyConditionTabChange = (value: string) => {
    const conditionIndex = Number.parseInt(value, 10);
    if (Number.isNaN(conditionIndex)) {
      return;
    }
    setQualifyConditionTabIndex(conditionIndex);
  };

  const handleRemoveQualifyCondition = (conditionIndex: number) => {
    setQualifyConditionTabIndex((current) => {
      const nextLength = qualifyConditions.length - 1;
      if (nextLength <= 0) {
        return 0;
      }
      if (conditionIndex < current) {
        return current - 1;
      }
      if (conditionIndex === current) {
        return Math.min(current, nextLength - 1);
      }
      return current;
    });
    onRemoveQualifyCondition(conditionIndex);
  };

  const createTrackingCallback = (conditionIndex: number) => () => {
    const persistedConditionId = qualifyConditionsValues?.[conditionIndex]?.id;
    if (onQualifyConditionSelect) {
      onQualifyConditionSelect(persistedConditionId ?? "", conditionIndex);
    }
  };

  const openQualifyConditionEditor = (conditionIndex: number) => {
    if (!enableQualifyConditionDirectOpen || !onQualifyConditionSelect) {
      return;
    }
    const conditionId = qualifyConditionsValues?.[conditionIndex]?.id;
    if (!conditionId) {
      return;
    }
    onQualifyConditionSelect(conditionId, conditionIndex);
  };

  const rewardTypeValue: string =
    typeof rewardType === "string" ? rewardType : "FREEBET";
  const currentRewardTypeField = useWatch({
    control,
    name: paths.type,
  });
  const currentRewardId = useWatch({
    control,
    name: paths.id,
  });
  const currentRewardStatus = useWatch({
    control,
    name: paths.status,
  });
  const valueTypeValue: string =
    typeof valueType === "string" ? valueType : "FIXED";
  const rewardValueRaw = useWatch({ control, name: paths.value });
  const rewardValueForAnalysis =
    typeof rewardValueRaw === "number" ? rewardValueRaw : undefined;
  const depositRequiredForAnalysis = useMemo(() => {
    if (!qualifyConditionsValues || qualifyConditionsValues.length === 0) {
      return undefined;
    }

    for (const condition of qualifyConditionsValues) {
      if (condition.type !== "DEPOSIT") {
        continue;
      }
      if (
        !condition.conditions ||
        typeof condition.conditions !== "object"
      ) {
        continue;
      }
      if (
        "targetAmount" in condition.conditions &&
        typeof condition.conditions.targetAmount === "number"
      ) {
        return condition.conditions.targetAmount;
      }
      if (
        "minAmount" in condition.conditions &&
        typeof condition.conditions.minAmount === "number"
      ) {
        return condition.conditions.minAmount;
      }
    }

    return undefined;
  }, [qualifyConditionsValues]);

  const rewardTypeChangeDescription = useMemo(() => {
    const pendingLabel =
      pendingRewardType &&
      getLabel(rewardTypeOptions, pendingRewardType);
    const conditionsText =
      qualifyConditions.length === 1
        ? "1 condición de calificación"
        : `${qualifyConditions.length} condiciones de calificación`;

    if (!pendingLabel) {
      return `Se eliminaran ${conditionsText} al cambiar el tipo de recompensa.`;
    }

    return `Cambiar a "${pendingLabel}" eliminara ${conditionsText}.`;
  }, [pendingRewardType, qualifyConditions.length]);

  const isPersistedReward = hasPersistedId(currentRewardId);

  const handleConfirmRewardTypeChange = () => {
    if (!pendingRewardType) {
      return;
    }
    if (pendingRewardType === "CASINO_SPINS") {
      onValueTypeChange("FIXED");
    }
    onTypeChange(pendingRewardType);
    setPendingRewardType(undefined);
  };

  const handleRewardTypeDialogOpenChange = (open: boolean) => {
    setShowRewardTypeConfirmDialog(open);
    if (!open) {
      setPendingRewardType(undefined);
    }
  };

  const ensureQualifyAccordionOpen = () => {
    setOpenAccordionItems((current) =>
      current.includes("qualify") ? current : [...current, "qualify"]
    );
  };

  const handleAddQualifyCondition = () => {
    setQualifyConditionTabIndex(qualifyConditions.length);
    onAddQualifyCondition();
    ensureQualifyAccordionOpen();
  };

  const handleOpenExistingConditionPicker = () => {
    if (
      !onAddExistingQualifyCondition ||
      selectableExistingConditions.length === 0
    ) {
      return;
    }
    setIsExistingConditionPickerOpen(true);
  };

  const handleAddExistingQualifyCondition = (conditionId: string) => {
    if (!onAddExistingQualifyCondition) {
      return;
    }
    setQualifyConditionTabIndex(qualifyConditions.length);
    onAddExistingQualifyCondition(conditionId);
    setIsExistingConditionPickerOpen(false);
    ensureQualifyAccordionOpen();
  };

  useEffect(() => {
    if (qualifyConditions.length > 0) {
      return;
    }
    setQualifyConditionTabIndex(0);
    setOpenAccordionItems((current) =>
      current.includes("qualify")
        ? current.filter((item) => item !== "qualify")
        : current
    );
  }, [qualifyConditions.length]);

  return (
    <div className="border-border/50 bg-card w-full space-y-4 rounded-lg border p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isPersistedReward ? "outline" : "secondary"}
            className={
              isPersistedReward
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }
          >
            {isPersistedReward ? "Reward guardada" : "Reward nueva"}
          </Badge>
          <span className="text-muted-foreground text-sm">
            {isPersistedReward
              ? "Esta reward ya existe y su tracking puede gestionarse."
              : "Esta reward todavía es un borrador dentro del formulario."}
          </span>
        </div>

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
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          {showBetEntryLauncher ? (
            <BetEntryLauncherCard
              title="Registro contextual de apuestas"
              description="Abre el formulario de bets para registrar la apuesta calificante o usar esta reward desde su propio contexto."
              actionLabel="Usar esta reward"
              href={rewardBetEntryHref}
              disabledReason={rewardBetEntryDisabledReason}
            />
          ) : null}

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
                  if (isRewardType(value)) {
                    if (value === rewardTypeValue) {
                      return;
                    }

                    if (qualifyConditions.length > 0) {
                      setValue(paths.type, currentRewardTypeField, {
                        shouldDirty: false,
                      });
                      setPendingRewardType(value);
                      setShowRewardTypeConfirmDialog(true);
                      return;
                    }

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
                    : "Valor Calculado (€)"
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

            <div className="w-full">
              <TextareaField<T>
                name={paths.activationRestrictions}
                label="Restricciones de activación"
                placeholder="Ej: Requiere verificación, opt-in o canje manual."
                rows={2}
              />
            </div>

            <div className="w-full">
              <TextareaField<T>
                name={paths.claimRestrictions}
                label="Restricciones de reclamación"
                placeholder="Ej: Debe reclamarse en 48h; asignación manual en hasta 72h."
                rows={2}
              />
            </div>

            <div className="w-full">
              <TextareaField<T>
                name={paths.withdrawalRestrictions}
                label="Restricciones de retirada de saldo"
                placeholder="Ej: Una retirada durante vigencia cancela bono/saldo promocional."
                rows={2}
              />
            </div>

            {rewardTypeValue === "FREEBET" && (
              <div className="grid gap-4 md:grid-cols-2">
                <CheckboxField<T>
                  name={paths.stakeNotReturned}
                  label="Stake no devuelto (SNR)"
                  tooltip="Al ganar con esta freebet, sólo se recibe la ganancia neta, no el importe de la freebet"
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
        </div>

        <Separator />

        <Accordion
          type="multiple"
          value={openAccordionItems}
          onValueChange={setOpenAccordionItems}
          className="space-y-4"
        >
          {showQualifyConditionsSection ? (
            <AccordionItem
              value="qualify"
              className="border-border bg-background rounded-md border border-b! border-l-4! border-l-orange-400!"
            >
            <AccordionPrimitive.Header className="px-6 py-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <AccordionPrimitive.Trigger
                  disabled={qualifyConditions.length === 0}
                  className="focus-visible:border-ring focus-visible:ring-ring/50 flex min-w-0 rounded-md text-left outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <TypographyLarge>Condiciones de Calificación</TypographyLarge>
                    <span className="text-muted-foreground block text-sm font-normal">
                      {qualifyConditions.length === 0 &&
                        "Sin condiciones — recompensa automática"}
                      {qualifyConditions.length === 1 &&
                        `${qualifyConditions.length} condición configurada`}
                      {qualifyConditions.length > 1 &&
                        `${qualifyConditions.length} condiciones configuradas`}
                    </span>
                  </div>
                </AccordionPrimitive.Trigger>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQualifyCondition}
                  disabled={areQualifyConditionsReadOnly}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Condición
                </Button>
                {onAddExistingQualifyCondition &&
                selectableExistingConditions.length > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenExistingConditionPicker}
                    disabled={areQualifyConditionsReadOnly}
                    className="w-full sm:w-auto"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Seleccionar Existente
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled
                    className="w-full sm:w-auto"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Seleccionar Existente
                  </Button>
                )}
                  <AccordionPrimitive.Trigger
                    disabled={qualifyConditions.length === 0}
                    className="focus-visible:border-ring focus-visible:ring-ring/50 self-end rounded-md p-1 outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 sm:self-auto [&[data-state=open]>svg]:rotate-180"
                  >
                    <ChevronDown className="text-muted-foreground size-4 transition-transform duration-200" />
                  </AccordionPrimitive.Trigger>
                </div>
              </div>
            </AccordionPrimitive.Header>
            <AccordionContent className="px-6 pb-4">
              {areQualifyConditionsReadOnly && qualifyConditionsReadOnlyReason ? (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {qualifyConditionsReadOnlyReason}
                </div>
              ) : null}
              {qualifyConditions.length === 0 ? null : qualifyConditions.length === 1 ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Badge
                      variant={
                        hasPersistedId(qualifyConditionsValues?.[0]?.id)
                          ? "outline"
                          : "secondary"
                      }
                      className={
                        hasPersistedId(qualifyConditionsValues?.[0]?.id)
                          ? "w-fit border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "w-fit bg-amber-100 text-amber-800"
                      }
                    >
                      {hasPersistedId(qualifyConditionsValues?.[0]?.id)
                        ? "QC guardada"
                        : "QC nueva"}
                    </Badge>
                  {enableQualifyConditionDirectOpen &&
                    onQualifyConditionSelect &&
                    qualifyConditionsValues?.[0]?.id && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openQualifyConditionEditor(0)}
                        >
                          Abrir editor
                        </Button>
                      </div>
                    )}</div>
                  <QualifyConditionForm<T>
                    paths={getQualifyConditionPaths(0)}
                    rewardType={rewardTypeValue}
                    conditionId={
                      hasPersistedId(qualifyConditionsValues?.[0]?.id)
                        ? qualifyConditionsValues?.[0]?.id
                        : undefined
                    }
                    onTypeChange={(type) =>
                      onQualifyConditionTypeChange(0, type)
                    }
                    onRemove={() => handleRemoveQualifyCondition(0)}
                    canRemove={canRemoveQualifyCondition(0)}
                    removeDisabledReason={getQualifyConditionRemoveDisabledReason(0)}
                    rewardValueType={valueTypeValue}
                    rewardHasContributingCondition={rewardHasContributingCondition}
                    isEditing={isEditing}
                    onViewTracking={createTrackingCallback(0)}
                    anchorCatalog={anchorCatalog}
                    anchorOccurrences={anchorOccurrences}
                    promotionTimeframe={promotionTimeframe}
                    promotion={promotion}
                    conditionServerData={rewardServerData?.qualifyConditions?.[0]}
                    rewardStatus={
                      typeof currentRewardStatus === "string"
                        ? currentRewardStatus
                        : undefined
                    }
                    promotionStatus={promotionStatus}
                    phaseStatus={phaseStatus}
                    readOnly={areQualifyConditionsReadOnly}
                    readOnlyReason={qualifyConditionsReadOnlyReason}
                    showBetEntryLauncher={isEditing}
                  />
                </div>
              ) : (
                <Tabs
                  value={activeQualifyConditionTabIndex.toString()}
                  onValueChange={handleQualifyConditionTabChange}
                >
                  <TabsList className="flex h-auto w-full flex-wrap gap-1 md:grid md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
                    {qualifyConditions.map((_, conditionIndex) => {
                      const conditionType =
                        qualifyConditionsValues?.[conditionIndex]?.type ??
                        "DEPOSIT";
                      const label = getLabel(
                        qualifyConditionTypeOptions,
                        conditionType
                      );

                      return (
                        <TabsTrigger
                          key={conditionIndex}
                          value={conditionIndex.toString()}
                        >
                          <span className="flex flex-wrap items-center justify-center gap-2">
                            <span>{label} ({conditionIndex + 1})</span>
                            <Badge
                              variant={
                                hasPersistedId(
                                  qualifyConditionsValues?.[conditionIndex]?.id
                                )
                                  ? "outline"
                                  : "secondary"
                              }
                              className={
                                hasPersistedId(
                                  qualifyConditionsValues?.[conditionIndex]?.id
                                )
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "bg-amber-100 text-amber-800"
                              }
                            >
                              {hasPersistedId(
                                qualifyConditionsValues?.[conditionIndex]?.id
                              )
                                ? "Guardada"
                                : "Nueva"}
                            </Badge>
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {qualifyConditions.map((field, conditionIndex) => (
                    <TabsContent
                      key={field.id}
                      value={conditionIndex.toString()}
                    >
                      <div className="space-y-3">
                        <Badge
                          variant={
                            hasPersistedId(
                              qualifyConditionsValues?.[conditionIndex]?.id
                            )
                              ? "outline"
                              : "secondary"
                          }
                          className={
                            hasPersistedId(
                              qualifyConditionsValues?.[conditionIndex]?.id
                            )
                              ? "w-fit border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "w-fit bg-amber-100 text-amber-800"
                          }
                        >
                          {hasPersistedId(
                            qualifyConditionsValues?.[conditionIndex]?.id
                          )
                            ? "QC guardada"
                            : "QC nueva"}
                        </Badge>
                        {enableQualifyConditionDirectOpen &&
                          onQualifyConditionSelect &&
                          qualifyConditionsValues?.[conditionIndex]?.id && (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openQualifyConditionEditor(conditionIndex)
                                }
                              >
                                Abrir editor
                              </Button>
                            </div>
                          )}
                        <QualifyConditionForm<T>
                          paths={getQualifyConditionPaths(conditionIndex)}
                          rewardType={rewardTypeValue}
                          conditionId={
                            hasPersistedId(
                              qualifyConditionsValues?.[conditionIndex]?.id
                            )
                              ? qualifyConditionsValues?.[conditionIndex]?.id
                              : undefined
                          }
                          onTypeChange={(type) =>
                            onQualifyConditionTypeChange(conditionIndex, type)
                          }
                          onRemove={() => handleRemoveQualifyCondition(conditionIndex)}
                          canRemove={canRemoveQualifyCondition(conditionIndex)}
                          removeDisabledReason={getQualifyConditionRemoveDisabledReason(conditionIndex)}
                          rewardValueType={valueTypeValue}
                          rewardHasContributingCondition={rewardHasContributingCondition}
                          isEditing={isEditing}
                          onViewTracking={createTrackingCallback(conditionIndex)}
                          anchorCatalog={anchorCatalog}
                          anchorOccurrences={anchorOccurrences}
                          promotionTimeframe={promotionTimeframe}
                          promotion={promotion}
                          conditionServerData={rewardServerData?.qualifyConditions?.[conditionIndex]}
                          rewardStatus={
                            typeof currentRewardStatus === "string"
                              ? currentRewardStatus
                              : undefined
                          }
                          promotionStatus={promotionStatus}
                          phaseStatus={phaseStatus}
                          readOnly={areQualifyConditionsReadOnly}
                          readOnlyReason={qualifyConditionsReadOnlyReason}
                          showBetEntryLauncher={isEditing}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </AccordionContent>
            </AccordionItem>
          ) : null}

          <AccordionItem
            value="usage"
            className="border-border bg-background rounded-md border border-b! border-l-4! border-l-blue-400!"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TypographyLarge>Condiciones de Uso</TypographyLarge>
                  {usageType && (
                    <Badge
                      variant={getUsageTypeBadgeVariant(String(usageType))}
                    >
                      {getUsageTypeLabel(String(usageType))}
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground text-sm font-normal">
                  Configuración de uso de la recompensa
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              {isUsageConditionsReadOnly && usageConditionsReadOnlyReason ? (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {isEditing && rewardServerData && (
          <UsageTrackingForm rewardServerData={rewardServerData} />
        )}
      </div>

      <ConfirmDialog
        open={showRewardTypeConfirmDialog}
        onOpenChange={handleRewardTypeDialogOpenChange}
        title="Confirmar cambio de tipo"
        description={rewardTypeChangeDescription}
        confirmText="Cambiar y descartar"
        cancelText="Cancelar"
        onConfirm={handleConfirmRewardTypeChange}
        onCancel={() => setPendingRewardType(undefined)}
      />
      <QualifyConditionPickerDialog
        open={isExistingConditionPickerOpen}
        onOpenChange={setIsExistingConditionPickerOpen}
        options={selectableExistingConditions}
        onSelect={handleAddExistingQualifyCondition}
      />
    </div>
  );
}


