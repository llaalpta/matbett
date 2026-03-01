import type {
  AnchorCatalog,
  AnchorCatalogByType,
  AnchorCatalogEntity,
  AnchorCatalogEvent,
  AnchorOccurrences,
} from "@matbett/shared";
import { getAnchorEventLabel } from "@matbett/shared";
import { useEffect, useMemo } from "react";
import { FieldValues, useFormContext, useWatch } from "react-hook-form";

import type { TimeframePaths } from "@/components/molecules/TimeframeForm";
import type { PromotionFormData } from "@/types/hooks";
import { toFiniteNumber } from "@/utils/numberHelpers";

const sortByLabel = (a: { label: string }, b: { label: string }) =>
  a.label.localeCompare(b.label, "es", {
    sensitivity: "base",
  });

const findTypeGroup = (
  anchorCatalog: AnchorCatalog | undefined,
  entityType: string | undefined
): AnchorCatalogByType | undefined => {
  if (!anchorCatalog || !entityType) {
    return undefined;
  }
  return anchorCatalog.find((group) => group.entityType === entityType);
};

const findEntity = (
  typeGroup: AnchorCatalogByType | undefined,
  entityRef: string | undefined
): AnchorCatalogEntity | undefined => {
  if (!typeGroup || !entityRef) {
    return undefined;
  }
  return typeGroup.entities.find((entity) => entity.entityRef === entityRef);
};

export function useTimeframeFormLogic<T extends FieldValues = PromotionFormData>(
  paths: TimeframePaths<T>,
  anchorCatalog: AnchorCatalog | undefined,
  anchorOccurrences: AnchorOccurrences | undefined
) {
  const modePath: string = paths.mode;
  const anchorEntityTypePath: string = paths.anchorEntityType;
  const anchorEntityRefTypePath: string = paths.anchorEntityRefType;
  const anchorEntityRefPath: string = paths.anchorEntityRef;
  const anchorEventPath: string = paths.anchorEvent;
  const offsetDaysPath: string = paths.offsetDays;

  const { control, setValue } = useFormContext<FieldValues>();

  const timeframeMode = useWatch({ control, name: modePath });
  const entityType = useWatch({ control, name: anchorEntityTypePath });
  const selectedEntityRef = useWatch({ control, name: anchorEntityRefPath });
  const selectedEntityRefType = useWatch({
    control,
    name: anchorEntityRefTypePath,
  });
  const selectedEvent = useWatch({ control, name: anchorEventPath });
  const offsetDays = useWatch({ control, name: offsetDaysPath });

  const isAbsolute = timeframeMode === "ABSOLUTE";
  const isRelative = timeframeMode === "RELATIVE";
  const isPromotion = timeframeMode === "PROMOTION";

  const selectedTypeGroup = useMemo(
    () => findTypeGroup(anchorCatalog, entityType),
    [anchorCatalog, entityType]
  );
  const selectedEntity = useMemo(
    () => findEntity(selectedTypeGroup, selectedEntityRef),
    [selectedEntityRef, selectedTypeGroup]
  );

  const entityTypeOptions = useMemo(() => {
    if (!anchorCatalog) {
      return [];
    }
    return anchorCatalog.map((typeGroup: AnchorCatalogByType) => ({
      value: typeGroup.entityType,
      label: typeGroup.entityTypeLabel,
    }));
  }, [anchorCatalog]);

  const entityOptions = useMemo(() => {
    if (!selectedTypeGroup) {
      return [];
    }
    return [...selectedTypeGroup.entities]
      .map((entity: AnchorCatalogEntity) => ({
      value: entity.entityRef,
      label: entity.entityLabel,
    }))
      .sort(sortByLabel);
  }, [selectedTypeGroup]);

  const eventOptions = useMemo(() => {
    if (!selectedEntity || !entityType || !selectedEntityRef) {
      return [];
    }

    const occurrenceByEvent = new Map(
      (anchorOccurrences ?? [])
        .filter(
          (occurrence) =>
            occurrence.entityType === entityType &&
            occurrence.entityRef === selectedEntityRef
        )
        .map((occurrence) => [occurrence.event, occurrence.occurredAt])
    );

    return selectedEntity.events.map((event: AnchorCatalogEvent) => ({
      value: event.event,
      label: occurrenceByEvent.get(event.event)
        ? `${getAnchorEventLabel(entityType, event.event)} (ocurrido)`
        : `${getAnchorEventLabel(entityType, event.event)} (pendiente)`,
    }));
  }, [anchorOccurrences, entityType, selectedEntity, selectedEntityRef]);

  const selectedEntityExists = useMemo(
    () => entityOptions.some((option) => option.value === selectedEntityRef),
    [entityOptions, selectedEntityRef]
  );

  const catalogEntityRefType = selectedEntity?.entityRefType;

  const selectedEventExists = useMemo(
    () => eventOptions.some((option) => option.value === selectedEvent),
    [eventOptions, selectedEvent]
  );

  useEffect(() => {
    if (!isRelative) {
      return;
    }

    if (selectedEntityRef && !selectedEntityExists) {
      setValue(anchorEntityRefPath, "", { shouldValidate: true, shouldDirty: true });
      setValue(anchorEntityRefTypePath, undefined, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue(anchorEventPath, "", { shouldValidate: true, shouldDirty: true });
      return;
    }

    if (
      selectedEntityRef &&
      catalogEntityRefType &&
      selectedEntityRefType !== catalogEntityRefType
    ) {
      setValue(anchorEntityRefTypePath, catalogEntityRefType, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    if (selectedEvent && !selectedEventExists) {
      setValue(anchorEventPath, "", { shouldValidate: true, shouldDirty: true });
    }
  }, [
    anchorEntityRefPath,
    anchorEntityRefTypePath,
    anchorEventPath,
    catalogEntityRefType,
    isRelative,
    selectedEntityExists,
    selectedEntityRef,
    selectedEntityRefType,
    selectedEvent,
    selectedEventExists,
    setValue,
  ]);

  const handleModeChange = (mode: string) => {
    if (mode === "RELATIVE") {
      return;
    }

    setValue(anchorEntityTypePath, "", { shouldValidate: true, shouldDirty: true });
    setValue(anchorEntityRefPath, "", { shouldValidate: true, shouldDirty: true });
    setValue(anchorEntityRefTypePath, undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(anchorEventPath, "", { shouldValidate: true, shouldDirty: true });
  };

  const handleEntityTypeChange = () => {
    setValue(anchorEntityRefPath, "", { shouldValidate: true, shouldDirty: true });
    setValue(anchorEntityRefTypePath, undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(anchorEventPath, "", { shouldValidate: true, shouldDirty: true });
  };

  const handleEntityRefChange = (entityRef: string) => {
    if (!selectedTypeGroup) {
      setValue(anchorEntityRefTypePath, undefined, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue(anchorEventPath, "", { shouldValidate: true, shouldDirty: true });
      return;
    }

    const entity = findEntity(selectedTypeGroup, entityRef);

    setValue(anchorEntityRefTypePath, entity?.entityRefType, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(anchorEventPath, "", { shouldValidate: true, shouldDirty: true });
  };

  const calculatedAnchorDate = useMemo(() => {
    if (!anchorOccurrences || !entityType || !selectedEntityRef || !selectedEvent) {
      return null;
    }
    const occurrence = anchorOccurrences.find(
      (value) =>
        value.entityType === entityType &&
        value.entityRef === selectedEntityRef &&
        value.event === selectedEvent
    );
    return occurrence?.occurredAt ?? null;
  }, [anchorOccurrences, entityType, selectedEntityRef, selectedEvent]);

  const calculatedEndDate = useMemo(() => {
    const offset = toFiniteNumber(offsetDays);
    if (!calculatedAnchorDate || offset === undefined) {
      return null;
    }
    const endDate = new Date(calculatedAnchorDate);
    endDate.setDate(endDate.getDate() + offset);
    return endDate;
  }, [calculatedAnchorDate, offsetDays]);

  return {
    control,
    timeframeMode,
    entityType,
    selectedEntityId: selectedEntityRef,
    selectedEvent,
    offsetDays,
    isAbsolute,
    isRelative,
    isPromotion,
    handleModeChange,
    handleEntityTypeChange,
    handleEntityRefChange,
    entityTypeOptions,
    entityOptions,
    eventOptions,
    selectedEntityExists,
    selectedEventExists,
    calculatedAnchorDate,
    calculatedEndDate,
  };
}
