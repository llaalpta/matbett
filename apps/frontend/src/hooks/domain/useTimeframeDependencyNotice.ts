import type { AnchorCatalog, AnchorOccurrences } from "@matbett/shared";
import { useMemo } from "react";
import { type Control, type FieldValues, useWatch } from "react-hook-form";

import type { TimeframePaths } from "@/components/molecules/TimeframeForm";

export function useTimeframeDependencyNotice<T extends FieldValues>(
  control: Control<T>,
  timeframePaths: TimeframePaths<T>,
  anchorCatalog?: AnchorCatalog,
  anchorOccurrences?: AnchorOccurrences,
  subjectLabel = "Esta entidad"
): string | null {
  const timeframeMode = useWatch({ control, name: timeframePaths.mode });
  const anchorEntityType = useWatch({
    control,
    name: timeframePaths.anchorEntityType,
  });
  const anchorEntityRefType = useWatch({
    control,
    name: timeframePaths.anchorEntityRefType,
  });
  const anchorEntityRef = useWatch({
    control,
    name: timeframePaths.anchorEntityRef,
  });
  const anchorEvent = useWatch({ control, name: timeframePaths.anchorEvent });

  return useMemo(() => {
    if (
      timeframeMode !== "RELATIVE" ||
      typeof anchorEntityType !== "string" ||
      (anchorEntityRefType !== "client" && anchorEntityRefType !== "persisted") ||
      typeof anchorEntityRef !== "string" ||
      anchorEntityRef.length === 0 ||
      typeof anchorEvent !== "string" ||
      anchorEvent.length === 0
    ) {
      return null;
    }

    const catalogByType = anchorCatalog?.find(
      (entry) => entry.entityType === anchorEntityType
    );
    const anchorEntity = catalogByType?.entities.find(
      (entity) =>
        entity.entityRefType === anchorEntityRefType &&
        entity.entityRef === anchorEntityRef
    );
    const eventLabel =
      anchorEntity?.events.find((event) => event.event === anchorEvent)
        ?.eventLabel ?? anchorEvent;
    const anchorLabel = anchorEntity?.entityLabel ?? anchorEntityRef;
    const entityTypeLabel = catalogByType?.entityTypeLabel ?? anchorEntityType;

    const occurrence = anchorOccurrences?.find(
      (item) =>
        item.entityType === anchorEntityType &&
        item.entityRefType === anchorEntityRefType &&
        item.entityRef === anchorEntityRef &&
        item.event === anchorEvent
    );
    const pendingTimestampNotice =
      occurrence && occurrence.occurredAt === null
        ? " Aun no hay timestamp registrado para ese evento."
        : "";

    return `${subjectLabel} depende de "${eventLabel}" en ${entityTypeLabel.toLowerCase()} "${anchorLabel}".${pendingTimestampNotice}`;
  }, [
    anchorCatalog,
    anchorEntityRef,
    anchorEntityRefType,
    anchorEntityType,
    anchorEvent,
    anchorOccurrences,
    subjectLabel,
    timeframeMode,
  ]);
}
