"use client";

import {
  activationMethodOptions,
  rewardTypeOptions,
  rewardValueTypeOptions,
  rewardStatusOptions,
  claimMethodOptions,
  qualifyConditionTypeOptions,
  getLabel,
  type AvailableTimeframes,
} from "@matbett/shared";
import { Trash2, Plus, Search } from "lucide-react";
import {
  useFieldArray,
  FieldArrayPath,
  useWatch,
  FieldValues,
  Path,
  FieldArray,
  useFormContext,
} from "react-hook-form";

import { CheckboxField, InputField, SelectField, TextareaField, TypographyLarge } from "@/components/atoms";
import { DateTimeField } from "@/components/atoms/DateTimeField";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRewardLogic } from "@/hooks/domain/useRewardLogic";
import { buildDefaultQualifyCondition } from "@/utils/formDefaults";
import { getUsageTypeBadgeVariant, getUsageTypeLabel } from "@/utils/usageTypeUtils";
import { useStatusDateSync } from "@/hooks/useStatusDateSync";

import { QualifyConditionForm } from "./QualifyConditionForm";
import { UsageConditionsForm } from "./UsageConditionsForm";
import { UsageTrackingForm } from "./UsageTrackingForm";

import type { RewardServerModel, PromotionFormData } from "@/types/hooks";

interface RewardFormProps<T extends FieldValues> {
  fieldPath: Path<T> | "";
  onRemove: () => void;
  canRemove?: boolean;
  isEditing?: boolean;
  onQualifyConditionSelect?: (id: string, index: number) => void;
  rewardServerData?: RewardServerModel; // Optional server data for tracking display
  availableTimeframes?: AvailableTimeframes; // Available timeframes from parent
}

export function RewardForm<T extends FieldValues>({
  fieldPath,
  onRemove,
  canRemove = false,
  isEditing = false,
  onQualifyConditionSelect,
  rewardServerData,
  availableTimeframes,
}: RewardFormProps<T>) {
  
  // 1. Usar lógica de dominio desacoplada (obtiene contexto internamente)
  const {
    control,
    handleTypeChange,
    handleValueTypeChange,
    hasContributingCondition,
    rewardType,
    valueType,
    getPath // Helper para construir paths agnósticos
  } = useRewardLogic(fieldPath);

  // Obtener setValue del contexto (useFormContext debe usarse si T es genérico, asumiendo que el componente está dentro de un FormProvider)
  const { setValue } = useFormContext();

  // Sincronizar fechas de estado para el reward
  // Nota: Casting necesario porque useStatusDateSync espera tipos específicos de PromotionFormData si T no coincide, 
  // pero aquí lo hacemos genérico. Asumiremos que el path es válido.
  useStatusDateSync({
    control: control as any,
    setValue: setValue as any,
    statusPath: getPath("status") as any,
    datePath: getPath("statusDate") as any, // Asumiendo que RewardSchema tendrá statusDate eventualmente, o lo añadimos dinámicamente
    serverDates: rewardServerData,
  });

  // 2. Construir el path para qualifyConditions
  const qualifyConditionsPath = getPath("qualifyConditions") as FieldArrayPath<T>;

  const {
    fields: qualifyConditions,
    append: appendCondition,
    remove: removeCondition,
  } = useFieldArray({
    control,
    name: qualifyConditionsPath,
  });

  // Watch entire qualifyConditions array to get types for tabs labels
  const qualifyConditionsValues = useWatch({
    control,
    name: qualifyConditionsPath as Path<T>,
  });

  const addQualifyCondition = () => {
    // Always start with DEPOSIT type by default
    // User can change type later via QualifyConditionForm's selector
    // which calls handleConditionTypeChange -> buildDefaultQualifyCondition(newType)
    const newCondition = buildDefaultQualifyCondition("DEPOSIT");
    // Type assertion to FieldArray element type
    appendCondition(newCondition as FieldArray<T, typeof qualifyConditionsPath>);
  };

  // Watch usageType para el resumen del accordion
  const usageType = useWatch({
    control,
    name: getPath("usageConditions.type") as Path<T>,
  });

  // Handler para cambio de tab de qualify condition
  const handleQualifyConditionTabChange = (value: string) => {
    const conditionIndex = parseInt(value);
    const condition = qualifyConditions[conditionIndex];
    if (condition?.id && onQualifyConditionSelect) {
      onQualifyConditionSelect(condition.id, conditionIndex);
    }
  };

  // Helper to create tracking callback for specific condition
  const createTrackingCallback = (conditionIndex: number) => () => {
    const condition = qualifyConditions[conditionIndex];
    if (condition?.id && onQualifyConditionSelect) {
      onQualifyConditionSelect(condition.id, conditionIndex);
    }
  };

  return (
    <div className="w-full space-y-4 rounded-lg border border-border/50 bg-card p-5 shadow-sm">
      {canRemove && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive/90">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {/* Configuración básica del reward */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField<T>
              name={getPath("type") as Path<T>}
              label="Tipo de Recompensa"
              options={rewardTypeOptions}
              onValueChange={(value) => handleTypeChange(value)}
              required
            />

            <SelectField<T>
              name={getPath("valueType") as Path<T>}
              label="Tipo de Valor"
              options={rewardValueTypeOptions}
              onValueChange={(value) => handleValueTypeChange(value)}
              required
            />

            {/* Campo de valor siempre visible */}
            <InputField<T>
              name={getPath("value") as Path<T>}
              label={
                valueType === "FIXED" ? "Valor Fijo (€)" : "Valor Calculado (€)"
              }
              type="number"
              min={0}
              step={0.01}
              placeholder={
                valueType === "FIXED"
                  ? "ej: 20"
                  : "Se calculará automáticamente"
              }
              disabled={valueType === "CALCULATED_FROM_CONDITIONS"}
              required
            />

            <SelectField<T>
              name={getPath("activationMethod") as Path<T>}
              label="Método de activación"
              options={activationMethodOptions}
              required
            />

            <SelectField<T>
              name={getPath("claimMethod") as Path<T>}
              label="Método de reclamación"
              options={claimMethodOptions}
              required
            />

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <SelectField<T>
                name={getPath("status") as Path<T>}
                label="Estado"
                options={rewardStatusOptions}
                tooltip="Estado actual de la recompensa en su ciclo de vida"
              />
              <DateTimeField<T>
                name={getPath("statusDate") as any} // Cast necesario si el schema base de Reward no tiene statusDate explicito en types, pero funcionará en runtime
                label="Fecha del estado"
                tooltip="Fecha en la que la recompensa cambió a este estado"
              />
            </div>
          </div>

          {/* Campo de restricciones de reclamación a ancho completo */}
          <div className="w-full">
            <TextareaField<T>
              name={getPath("claimRestrictions") as Path<T>}
              label="Restricciones de reclamación"
              placeholder="Ej: Solo usuarios nuevos, no combinar con otras ofertas, etc."
              rows={2}
            />
          </div>

          {/* SNR solo para FREEBET - propiedad de la reward, no de usageConditions */}
          {rewardType === "FREEBET" && (
            <CheckboxField<T>
              name={getPath("stakeNotReturned") as Path<T>}
              label="Stake No Devuelto (SNR)"
              tooltip="Al ganar con esta freebet, solo se recibe la ganancia neta, no el importe de la freebet"
            />
          )}
        </div>

        <Separator />

        {/* Accordion para secciones colapsables */}
        <Accordion type="multiple" defaultValue={[]} className="space-y-4">
          {/* Condiciones de calificación */}
          <AccordionItem value="qualify" className="rounded-md border border-border bg-background !border-l-4 !border-l-orange-400 !border-b">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col items-start gap-1 flex-1">
                <TypographyLarge>
                  Condiciones de Calificación
                </TypographyLarge>
                <span className="text-sm text-muted-foreground font-normal">
                  {qualifyConditions.length === 0 &&
                    "Sin condiciones — recompensa automática"}
                  {qualifyConditions.length === 1 &&
                    `${qualifyConditions.length} condición configurada`}
                  {qualifyConditions.length > 1 &&
                    `${qualifyConditions.length} condiciones configuradas`}
                </span>
              
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end ${qualifyConditions.length > 0 ? "mb-4 pb-4 border-b border-border" : ""}`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQualifyCondition}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Condición
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // TODO: Implementar selector de condiciones existentes
                  }}
                  className="w-full sm:w-auto"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Seleccionar Existente
                </Button>
              </div>
              {qualifyConditions.length === 0 ? null : qualifyConditions.length === 1 ? (
                <QualifyConditionForm<T>
                  fieldPath={`${qualifyConditionsPath}.0` as Path<T>}
                  rewardType={rewardType as string}
                  onRemove={() => removeCondition(0)}
                  canRemove={true}
                  rewardValueType={valueType as string}
                  rewardHasContributingCondition={hasContributingCondition()}
                  isEditing={isEditing}
                  onViewTracking={createTrackingCallback(0)}
                  availableTimeframes={availableTimeframes}
                  conditionServerData={rewardServerData?.qualifyConditions?.[0]} // Pasar datos del servidor en cascada
                />
              ) : (
                <Tabs defaultValue="0" onValueChange={handleQualifyConditionTabChange}>
                  <TabsList className="flex h-auto w-full flex-wrap gap-1 md:grid md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
                    {qualifyConditions.map((_, conditionIndex) => {
                      // Get type from watched values or default to DEPOSIT if not yet available
                      const conditionType = (qualifyConditionsValues?.[conditionIndex] as any)?.type || "DEPOSIT";
                      const label = getLabel(qualifyConditionTypeOptions, conditionType);
                      
                      return (
                        <TabsTrigger
                          key={conditionIndex}
                          value={conditionIndex.toString()}
                        >
                          {label} ({conditionIndex + 1})
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {qualifyConditions.map((field, conditionIndex) => (
                    <TabsContent key={field.id} value={conditionIndex.toString()}>
                      <QualifyConditionForm<T>
                        fieldPath={`${qualifyConditionsPath}.${conditionIndex}` as Path<T>}
                        rewardType={rewardType as string}
                        onRemove={() => removeCondition(conditionIndex)}
                        canRemove={true}
                        rewardValueType={valueType as string}
                        rewardHasContributingCondition={hasContributingCondition()}
                        isEditing={isEditing}
                        onViewTracking={createTrackingCallback(conditionIndex)}
                        availableTimeframes={availableTimeframes}
                        conditionServerData={rewardServerData?.qualifyConditions?.[conditionIndex]} // Pasar datos del servidor en cascada
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Condiciones de uso específicas por tipo */}
          <AccordionItem value="usage" className="rounded-md border border-border bg-background !border-l-4 !border-l-blue-400 !border-b">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TypographyLarge>Condiciones de Uso</TypographyLarge>
                  {usageType && (
                    <Badge variant={getUsageTypeBadgeVariant(usageType as string)}>
                      {getUsageTypeLabel(usageType as string)}
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  Configuración de uso de la recompensa
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <UsageConditionsForm<T>
                fieldPath={getPath("usageConditions") as Path<T>}
                availableTimeframes={availableTimeframes}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Seguimiento de uso específico por tipo - solo en edición */}
        {isEditing && rewardServerData && (
          <UsageTrackingForm
            rewardServerData={rewardServerData}
          />
        )}
      </div>
    </div>
  );
}