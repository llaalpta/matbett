"use client";

import { timeframeModeOptions, type AvailableTimeframes } from "@matbett/shared";
import { FieldValues, Path } from "react-hook-form";

import { DateTimeField } from "@/components/atoms/DateTimeField";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { useTimeframeFormLogic } from "@/hooks/domain/useTimeframeFormLogic";
import type { PromotionFormData } from "@/types/hooks";

interface TimeframeFormProps<T extends FieldValues> {
  basePath: Path<T>; // ej: "phases.0.timeframe"
  title?: string;
  forceAbsolute?: boolean; // Para promociones que siempre son absolutas
  hideModeSelector?: boolean; // Ocultar selector de modo y mostrar solo fechas
  availableTimeframes?: AvailableTimeframes; // Available timeframes passed from parent
}

export function TimeframeForm<T extends FieldValues = PromotionFormData>({
  basePath,
  title = "Tipo de plazo",
  forceAbsolute = false,
  hideModeSelector = false,
  availableTimeframes,
}: TimeframeFormProps<T>) {
  // Hook centralizado de lógica
  const {
    timeframeMode,
    entityType,
    isAbsolute,
    isRelative,
    isPromotion,
    entityTypeOptions,
    entityOptions,
    eventOptions,
    calculatedAnchorDate,
    calculatedEndDate,
    updateResolvedDates,
  } = useTimeframeFormLogic<T>(basePath, availableTimeframes);


  // --- RENDER ---
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 p-4 space-y-4">
      {/* MODO ABSOLUTO - Sin selector de modo (hideModeSelector=true) */}
      {hideModeSelector && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateTimeField<T>
            name={`${basePath}.start` as Path<T>}
            label="Fecha de inicio"
            required
          />
          <DateTimeField<T>
            name={`${basePath}.end` as Path<T>}
            label="Fecha de fin"
          />
        </div>
      )}

      {/* MODO ABSOLUTO - Con selector de modo */}
      {!hideModeSelector && (isAbsolute || forceAbsolute) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SelectField<T>
            name={`${basePath}.mode` as Path<T>}
            label={title}
            options={timeframeModeOptions}
            disabled={forceAbsolute}
            required
          />
          <DateTimeField<T>
            name={`${basePath}.start` as Path<T>}
            label="Fecha de inicio"
            required
          />
          <DateTimeField<T>
            name={`${basePath}.end` as Path<T>}
            label="Fecha de fin"
          />
        </div>
      )}

      {/* MODO RELATIVO */}
      {isRelative && !forceAbsolute && !hideModeSelector && (
        <div className="space-y-4">
          {/* Fila 1: Configuración de Anchor */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField<T>
              name={`${basePath}.mode` as Path<T>}
              label={title}
              options={timeframeModeOptions}
              disabled={forceAbsolute}
              required
            />
            <SelectField<T>
              name={`${basePath}.anchor.entityType` as Path<T>}
              label="Tipo de entidad"
              options={entityTypeOptions}
              onValueChange={updateResolvedDates}
              required
            />
            <SelectField<T>
              name={`${basePath}.anchor.entityId` as Path<T>}
              label="Entidad"
              options={entityOptions}
              placeholder="Selecciona una entidad"
              disabled={!entityType}
              onValueChange={updateResolvedDates}
              required
            />
          </div>

          {/* Fila 2: Configuración de Evento y Duración */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField<T>
              name={`${basePath}.anchor.event` as Path<T>}
              label="Evento"
              options={eventOptions}
              placeholder="Selecciona un evento"
              disabled={!entityType}
              onValueChange={updateResolvedDates}
              required
            />
            <InputField<T>
              name={`${basePath}.offsetDays` as Path<T>}
              label="Duración (días)"
              type="number"
              min={1}
              placeholder="Ej: 7"
              disabled={!entityType}
              onValueChange={updateResolvedDates}
              required
            />

            {/* Campo Informativo (Read-only) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Fecha de fin (calculada)
              </label>
              <div className="flex min-h-[40px] w-full items-center rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700">
                {calculatedEndDate ? (
                  calculatedEndDate.toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                ) : (
                  <span className="text-gray-400">
                    Se calculará automáticamente
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info Adicional */}
          {calculatedAnchorDate && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-700">
                <strong>Fecha de referencia:</strong>{" "}
                {new Date(calculatedAnchorDate).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODO PROMOCION */}
      {isPromotion && !forceAbsolute && !hideModeSelector && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SelectField<T>
            name={`${basePath}.mode` as Path<T>}
            label={title}
            options={timeframeModeOptions}
            disabled={forceAbsolute}
            required
          />
        </div>
      )}
    </div>
  );
}