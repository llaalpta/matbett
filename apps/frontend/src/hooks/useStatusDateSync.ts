import { useEffect } from "react";
import { Control, FieldValues, Path, PathValue, useWatch, UseFormSetValue } from "react-hook-form";
import type { 
  PromotionEntity, 
  RewardEntity, 
  QualifyConditionEntity 
} from "@matbett/shared";

// Reutilizar tipos de @matbett/shared usando Pick para extraer solo los timestamps
export type PromotionPhaseDates = Pick<PromotionEntity, 'activatedAt' | 'completedAt' | 'expiredAt'>;

export type RewardDates = Pick<RewardEntity, 
  | 'qualifyConditionsFulfilledAt' 
  | 'claimedAt' 
  | 'receivedAt' 
  | 'useStartedAt' 
  | 'useCompletedAt' 
  | 'expiredAt'
>;

export type QualifyConditionDates = Pick<QualifyConditionEntity, 
  | 'startedAt' 
  | 'qualifiedAt' 
  | 'failedAt' 
  | 'expiredAt'
>;

// Unión de tipos soportados (Partial para flexibilidad si faltan campos en runtime)
export type ServerEntityDates = 
  | Partial<PromotionPhaseDates> 
  | Partial<RewardDates> 
  | Partial<QualifyConditionDates>;

interface UseStatusDateSyncProps<T extends FieldValues> {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  statusPath: Path<T>;
  datePath: Path<T>;
  serverDates?: ServerEntityDates;
}

export function useStatusDateSync<T extends FieldValues>({
  control,
  setValue,
  statusPath,
  datePath,
  serverDates,
}: UseStatusDateSyncProps<T>) {
  const status = useWatch({ control, name: statusPath });

  useEffect(() => {
    if (!status || !serverDates) return;

    let targetDate: Date | null | undefined = undefined;

    // Helper para acceso seguro a propiedades de la unión
    // Al ser una unión de Partials, el acceso a propiedades no comunes requiere aserción o comprobación 'in'.
    // Dado que mapeamos status -> propiedad específica, usamos un objeto indexable seguro.
    const dates = serverDates as Record<string, Date | null | undefined>;

    switch (status) {
      // Promotion & Phase
      case 'ACTIVE':
        targetDate = dates.activatedAt;
        break;
      case 'COMPLETED':
        targetDate = dates.completedAt;
        break;
      case 'EXPIRED':
        targetDate = dates.expiredAt;
        break;
      // Reward
      case 'PENDING_TO_CLAIM':
        targetDate = dates.qualifyConditionsFulfilledAt;
        break;
      case 'CLAIMED':
        targetDate = dates.claimedAt;
        break;
      case 'RECEIVED':
        targetDate = dates.receivedAt;
        break;
      case 'IN_USE':
        targetDate = dates.useStartedAt;
        break;
      case 'USED':
        targetDate = dates.useCompletedAt;
        break;
      // QualifyCondition
      case 'QUALIFYING':
        targetDate = dates.startedAt;
        break;
      case 'FULFILLED':
        targetDate = dates.qualifiedAt;
        break;
      case 'FAILED':
        targetDate = dates.failedAt;
        break;
    }

    if (targetDate) {
        setValue(datePath, targetDate as PathValue<T, Path<T>>, { shouldValidate: true, shouldDirty: true });
    } else {
        setValue(datePath, null as PathValue<T, Path<T>>); 
    }

  }, [status, serverDates, setValue, datePath]);
}
