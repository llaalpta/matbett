"use client";

import {
  timeframeModeOptions,
  type AnchorCatalog,
  type AnchorOccurrences,
} from "@matbett/shared";
import { FieldValues, Path, useFormContext } from "react-hook-form";

import { DateTimeField } from "@/components/atoms/DateTimeField";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTimeframeDependencyNotice } from "@/hooks/domain/useTimeframeDependencyNotice";
import { useTimeframeFormLogic } from "@/hooks/domain/useTimeframeFormLogic";
import type { PromotionFormData } from "@/types/hooks";

export interface TimeframePaths<T extends FieldValues> {
  mode: Path<T>;
  start: Path<T>;
  end: Path<T>;
  anchorEntityType: Path<T>;
  anchorEntityRefType: Path<T>;
  anchorEntityRef: Path<T>;
  anchorEvent: Path<T>;
  offsetDays: Path<T>;
}

interface TimeframeFormProps<T extends FieldValues> {
  paths: TimeframePaths<T>;
  title?: string;
  forceAbsolute?: boolean; // Para promociones que siempre son absolutas
  hideModeSelector?: boolean; // Ocultar selector de modo y mostrar solo fechas
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
  dependencySubjectLabel?: string;
}

export function TimeframeForm<T extends FieldValues = PromotionFormData>({
  paths,
  title = "Tipo de plazo",
  forceAbsolute = false,
  hideModeSelector = false,
  anchorCatalog,
  anchorOccurrences,
  dependencySubjectLabel = "Esta entidad",
}: TimeframeFormProps<T>) {
  const { control } = useFormContext<T>();
  // Hook centralizado de logica
  const {
    entityType,
    isAbsolute,
    isRelative,
    isPromotion,
    handleModeChange,
    handleEntityTypeChange,
    handleEntityRefChange,
    entityTypeOptions,
    entityOptions,
    eventOptions,
    calculatedAnchorDate,
    calculatedEndDate,
  } = useTimeframeFormLogic<T>(paths, anchorCatalog, anchorOccurrences);
  const dependencyNotice = useTimeframeDependencyNotice(
    control,
    paths,
    anchorCatalog,
    anchorOccurrences,
    dependencySubjectLabel
  );

  // --- RENDER ---
  return (
    <div className="border-border/40 bg-muted/20 space-y-4 rounded-md border p-4">
      {/* MODO ABSOLUTO - Sin selector de modo (hideModeSelector=true) */}
      {hideModeSelector && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateTimeField<T>
            name={paths.start}
            label="Fecha de inicio"
            required
          />
          <DateTimeField<T> name={paths.end} label="Fecha de finalización" />
        </div>
      )}

      {/* MODO ABSOLUTO - Con selector de modo */}
      {!hideModeSelector && (isAbsolute || forceAbsolute) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SelectField<T>
            name={paths.mode}
            label={title}
            options={timeframeModeOptions}
            onValueChange={handleModeChange}
            disabled={forceAbsolute}
            required
          />
          <DateTimeField<T>
            name={paths.start}
            label="Fecha de inicio"
            required
          />
          <DateTimeField<T> name={paths.end} label="Fecha de finalización" />
        </div>
      )}

      {/* MODO RELATIVO */}
      {isRelative && !forceAbsolute && !hideModeSelector && (
        <div className="space-y-4">
          {/* Fila 1: Configuracion de Anchor */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField<T>
              name={paths.mode}
              label={title}
              options={timeframeModeOptions}
              onValueChange={handleModeChange}
              disabled={forceAbsolute}
              required
            />
            <SelectField<T>
              name={paths.anchorEntityType}
              label="Tipo de entidad"
              options={entityTypeOptions}
              onValueChange={handleEntityTypeChange}
              required
            />
            <SelectField<T>
              name={paths.anchorEntityRef}
              label="Entidad"
              options={entityOptions}
              onValueChange={handleEntityRefChange}
              placeholder="Selecciona una entidad"
              disabled={!entityType}
              required
            />
          </div>

          {/* Fila 2: Configuracion de Evento y Duracion */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField<T>
              name={paths.anchorEvent}
              label="Evento"
              options={eventOptions}
              placeholder="Selecciona un evento"
              disabled={!entityType}
              required
            />
            <InputField<T>
              name={paths.offsetDays}
              label="Duracion (dias)"
              type="number"
              min={1}
              placeholder="Ej: 7"
              disabled={!entityType}
              required
            />

            {/* Campo Informativo (Read-only) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Fecha de finalización (calculada)
              </label>
              <div className="flex min-h-10 w-full items-center rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700">
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
                    Se calculara automaticamente
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
                {calculatedAnchorDate.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {dependencyNotice ? (
            <Alert className="border-amber-300 bg-amber-50/70 text-amber-900">
              <AlertDescription className="text-amber-900">
                {dependencyNotice}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      )}

      {/* MODO PROMOCION */}
      {isPromotion && !forceAbsolute && !hideModeSelector && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SelectField<T>
            name={paths.mode}
            label={title}
            options={timeframeModeOptions}
            onValueChange={handleModeChange}
            disabled={forceAbsolute}
            required
          />
        </div>
      )}
    </div>
  );
}
