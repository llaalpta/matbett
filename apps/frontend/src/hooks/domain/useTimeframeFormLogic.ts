import type {
  AvailableTimeframes,
  AvailableTimeframesByType,
  AvailableTimeframeEntity,
  TimeframeEventTimestamp,
} from "@matbett/shared";
import { useCallback, useMemo } from "react";
import {
  FieldValues,
  Path,
  PathValue,
  useFormContext,
  useWatch,
} from "react-hook-form";

import type { PromotionFormData } from "@/types/hooks";

/**
 * Hook de lógica de dominio para TimeframeForm.
 * Centraliza toda la lógica: watchers, opciones de selects, cálculos y handlers.
 */
export function useTimeframeFormLogic<T extends FieldValues = PromotionFormData>(
  basePath: Path<T>,
  availableTimeframes: AvailableTimeframes | undefined
) {
  // 1. Contexto del formulario
  const { setValue, control, getValues } = useFormContext<T>();

  // 2. Watchers locales
  const timeframeMode = useWatch({
    control,
    name: `${basePath}.mode` as Path<T>,
  });

  const entityType = useWatch({
    control,
    name: `${basePath}.anchor.entityType` as Path<T>,
  });

  const selectedEntityId = useWatch({
    control,
    name: `${basePath}.anchor.entityId` as Path<T>,
  });

  const selectedEvent = useWatch({
    control,
    name: `${basePath}.anchor.event` as Path<T>,
  });

  const offsetDays = useWatch({
    control,
    name: `${basePath}.offsetDays` as Path<T>,
  });

  // 3. Flags derivados
  const isAbsolute = timeframeMode === "ABSOLUTE";
  const isRelative = timeframeMode === "RELATIVE";
  const isPromotion = timeframeMode === "PROMOTION";

  // 4. Opciones de selects (migrado de useTimeframeAnchorOptions)
  const entityTypeOptions = useMemo(() => {
    if (!availableTimeframes) return [];
    return availableTimeframes.map((typeGroup: AvailableTimeframesByType) => ({
      value: typeGroup.entityType,
      label: typeGroup.entityTypeLabel,
    }));
  }, [availableTimeframes]);

  const entityOptions = useMemo(() => {
    if (!availableTimeframes || !entityType) return [];
    const typeGroup = availableTimeframes.find(
      (group: AvailableTimeframesByType) => group.entityType === entityType
    );
    if (!typeGroup) return [];
    return typeGroup.entities.map((entity: AvailableTimeframeEntity) => ({
      value: entity.entityId,
      label: entity.entityLabel,
    }));
  }, [availableTimeframes, entityType]);

  const eventOptions = useMemo(() => {
    if (!availableTimeframes || !entityType || !selectedEntityId) return [];
    const typeGroup = availableTimeframes.find(
      (group: AvailableTimeframesByType) => group.entityType === entityType
    );
    if (!typeGroup) return [];
    const entity = typeGroup.entities.find(
      (e: AvailableTimeframeEntity) => e.entityId === selectedEntityId
    );
    if (!entity) return [];
    return entity.timeStamps.map((timestamp: TimeframeEventTimestamp) => ({
      value: timestamp.event,
      label: timestamp.eventLabel,
    }));
  }, [availableTimeframes, entityType, selectedEntityId]);

  // 5. Fecha calculada del anchor seleccionado
  const calculatedAnchorDate = useMemo(() => {
    if (
      !availableTimeframes ||
      !entityType ||
      !selectedEntityId ||
      !selectedEvent
    )
      return null;

    const typeGroup = availableTimeframes.find(
      (group: AvailableTimeframesByType) => group.entityType === entityType
    );
    if (!typeGroup) return null;

    const entity = typeGroup.entities.find(
      (e: AvailableTimeframeEntity) => e.entityId === selectedEntityId
    );
    if (!entity) return null;

    const eventTimestamp = entity.timeStamps.find(
      (ts: TimeframeEventTimestamp) => ts.event === selectedEvent
    );
    if (!eventTimestamp || !eventTimestamp.date) return null;

    return eventTimestamp.date;
  }, [availableTimeframes, entityType, selectedEntityId, selectedEvent]);

  // 6. Fecha de fin calculada (anchor + offsetDays)
  const calculatedEndDate = useMemo(() => {
    if (!calculatedAnchorDate || !offsetDays) return null;

    const anchorDate = new Date(calculatedAnchorDate);
    if (isNaN(anchorDate.getTime())) return null;

    const endDate = new Date(anchorDate);
    endDate.setDate(endDate.getDate() + Number(offsetDays));
    return endDate;
  }, [calculatedAnchorDate, offsetDays]);

  // 7. Helper para obtener fecha de anchor desde availableTimeframes
  const getAnchorDateFromTimeframes = useCallback(
    (entType: string, entId: string, event: string): string | null => {
      if (!availableTimeframes || !entType || !entId || !event) return null;

      const typeGroup = availableTimeframes.find(
        (group: AvailableTimeframesByType) => group.entityType === entType
      );
      if (!typeGroup) return null;

      const entity = typeGroup.entities.find(
        (e: AvailableTimeframeEntity) => e.entityId === entId
      );
      if (!entity) return null;

      const eventTimestamp = entity.timeStamps.find(
        (ts: TimeframeEventTimestamp) => ts.event === event
      );
      if (!eventTimestamp || !eventTimestamp.date) return null;

      return eventTimestamp.date;
    },
    [availableTimeframes]
  );

  // 8. Handler para actualizar start/end calculados
  // Usa getValues para leer el estado más actual (evita lag de useWatch)
  const updateResolvedDates = useCallback(() => {
    // Leer valores actuales del formulario
    const currentMode = getValues(`${basePath}.mode` as Path<T>);
    if (currentMode !== "RELATIVE") return;

    const currentEntityType = getValues(`${basePath}.anchor.entityType` as Path<T>);
    const currentEntityId = getValues(`${basePath}.anchor.entityId` as Path<T>);
    const currentEvent = getValues(`${basePath}.anchor.event` as Path<T>);
    const currentOffsetDays = getValues(`${basePath}.offsetDays` as Path<T>);

    // Obtener fecha de anchor
    const anchorDateStr = getAnchorDateFromTimeframes(
      currentEntityType as string,
      currentEntityId as string,
      currentEvent as string
    );

    if (!anchorDateStr) {
      setValue(`${basePath}.start` as Path<T>, null as PathValue<T, Path<T>>);
      setValue(`${basePath}.end` as Path<T>, null as PathValue<T, Path<T>>);
      return;
    }

    const startDate = new Date(anchorDateStr);
    if (isNaN(startDate.getTime())) {
      setValue(`${basePath}.start` as Path<T>, null as PathValue<T, Path<T>>);
      setValue(`${basePath}.end` as Path<T>, null as PathValue<T, Path<T>>);
      return;
    }

    // Establecer start como la fecha del anchor
    setValue(`${basePath}.start` as Path<T>, startDate as PathValue<T, Path<T>>);

    // Calcular y establecer end
    if (currentOffsetDays) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Number(currentOffsetDays));
      setValue(`${basePath}.end` as Path<T>, endDate as PathValue<T, Path<T>>);
    } else {
      setValue(`${basePath}.end` as Path<T>, null as PathValue<T, Path<T>>);
    }
  }, [basePath, getAnchorDateFromTimeframes, getValues, setValue]);

  return {
    control,
    // Valores observados
    timeframeMode,
    entityType,
    selectedEntityId,
    selectedEvent,
    offsetDays,
    // Flags
    isAbsolute,
    isRelative,
    isPromotion,
    // Opciones de selects
    entityTypeOptions,
    entityOptions,
    eventOptions,
    // Fechas calculadas (para mostrar en UI)
    calculatedAnchorDate,
    calculatedEndDate,
    // Handler para actualizar start/end
    updateResolvedDates,
  };
}
