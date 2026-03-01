import type { PromotionEntity, QualifyConditionEntity, RewardEntity } from "@matbett/shared";
import { useEffect } from "react";
import { type Control, type Path, type UseFormSetValue, useWatch } from "react-hook-form";

import type { PromotionFormData, RewardFormData } from "@/types/hooks";

type PromotionPhaseDates = Pick<PromotionEntity, "activatedAt" | "completedAt" | "expiredAt">;
type RewardDates = Pick<
  RewardEntity,
  | "qualifyConditionsFulfilledAt"
  | "claimedAt"
  | "receivedAt"
  | "useStartedAt"
  | "useCompletedAt"
  | "expiredAt"
>;
type QualifyConditionDates = Pick<
  QualifyConditionEntity,
  "startedAt" | "qualifiedAt" | "failedAt" | "expiredAt"
>;

type NextDateProps<ServerDates> = {
  status: unknown;
  currentDate: unknown;
  serverDates?: ServerDates;
  resolveDate: (status: unknown, serverDates?: ServerDates) => Date | null | undefined;
};

function parseDateValue(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
}

function areDatesEqual(left: unknown, right: unknown): boolean {
  const leftDate = parseDateValue(left);
  const rightDate = parseDateValue(right);

  if (!leftDate || !rightDate) {
    return false;
  }

  return leftDate.getTime() === rightDate.getTime();
}

function resolvePromotionPhaseDate(
  status: unknown,
  serverDates?: PromotionPhaseDates
): Date | null | undefined {
  switch (status) {
    case "ACTIVE":
      return serverDates?.activatedAt;
    case "COMPLETED":
      return serverDates?.completedAt;
    case "EXPIRED":
      return serverDates?.expiredAt;
    default:
      return undefined;
  }
}

function resolveRewardDate(
  status: unknown,
  serverDates?: RewardDates
): Date | null | undefined {
  switch (status) {
    case "PENDING_TO_CLAIM":
      return serverDates?.qualifyConditionsFulfilledAt;
    case "CLAIMED":
      return serverDates?.claimedAt;
    case "RECEIVED":
      return serverDates?.receivedAt;
    case "IN_USE":
      return serverDates?.useStartedAt;
    case "USED":
      return serverDates?.useCompletedAt;
    case "EXPIRED":
      return serverDates?.expiredAt;
    default:
      return undefined;
  }
}

function resolveQualifyConditionDate(
  status: unknown,
  serverDates?: QualifyConditionDates
): Date | null | undefined {
  switch (status) {
    case "QUALIFYING":
      return serverDates?.startedAt;
    case "FULFILLED":
      return serverDates?.qualifiedAt;
    case "FAILED":
      return serverDates?.failedAt;
    case "EXPIRED":
      return serverDates?.expiredAt;
    default:
      return undefined;
  }
}

function resolveNextDate<ServerDates>({
  status,
  currentDate,
  serverDates,
  resolveDate,
}: NextDateProps<ServerDates>): Date | undefined {
  if (!status) {
    return undefined;
  }

  const targetDate = resolveDate(status, serverDates);
  if (targetDate !== null && targetDate !== undefined) {
    return targetDate;
  }

  if (!currentDate) {
    return new Date();
  }

  return undefined;
}

export function usePromotionStatusDateSync({
  control,
  setValue,
  statusPath,
  datePath,
  serverDates,
}: {
  control: Control<PromotionFormData>;
  setValue: UseFormSetValue<PromotionFormData>;
  statusPath: Path<PromotionFormData>;
  datePath: Path<PromotionFormData>;
  serverDates?: PromotionPhaseDates;
}) {
  const status = useWatch<PromotionFormData>({ control, name: statusPath });
  const currentDate = useWatch<PromotionFormData>({ control, name: datePath });

  useEffect(() => {
    const nextDate = resolveNextDate({
      status,
      currentDate,
      serverDates,
      resolveDate: resolvePromotionPhaseDate,
    });
    if (!nextDate || areDatesEqual(currentDate, nextDate)) {
      return;
    }

    setValue(datePath, nextDate, { shouldValidate: true, shouldDirty: true });
  }, [currentDate, datePath, serverDates, setValue, status]);
}

export function usePhaseStatusDateSync({
  control,
  setValue,
  statusPath,
  datePath,
  serverDates,
}: {
  control: Control<PromotionFormData>;
  setValue: UseFormSetValue<PromotionFormData>;
  statusPath: Path<PromotionFormData>;
  datePath: Path<PromotionFormData>;
  serverDates?: PromotionPhaseDates;
}) {
  const status = useWatch<PromotionFormData>({ control, name: statusPath });
  const currentDate = useWatch<PromotionFormData>({ control, name: datePath });

  useEffect(() => {
    const nextDate = resolveNextDate({
      status,
      currentDate,
      serverDates,
      resolveDate: resolvePromotionPhaseDate,
    });
    if (!nextDate || areDatesEqual(currentDate, nextDate)) {
      return;
    }

    setValue(datePath, nextDate, { shouldValidate: true, shouldDirty: true });
  }, [currentDate, datePath, serverDates, setValue, status]);
}

export function usePromotionRewardStatusDateSync({
  control,
  setValue,
  statusPath,
  datePath,
  serverDates,
}: {
  control: Control<PromotionFormData>;
  setValue: UseFormSetValue<PromotionFormData>;
  statusPath: Path<PromotionFormData>;
  datePath: Path<PromotionFormData>;
  serverDates?: RewardDates;
}) {
  const status = useWatch<PromotionFormData>({ control, name: statusPath });
  const currentDate = useWatch<PromotionFormData>({ control, name: datePath });

  useEffect(() => {
    const nextDate = resolveNextDate({
      status,
      currentDate,
      serverDates,
      resolveDate: resolveRewardDate,
    });
    if (!nextDate || areDatesEqual(currentDate, nextDate)) {
      return;
    }

    setValue(datePath, nextDate, { shouldValidate: true, shouldDirty: true });
  }, [currentDate, datePath, serverDates, setValue, status]);
}

export function useStandaloneRewardStatusDateSync({
  control,
  setValue,
  statusPath,
  datePath,
  serverDates,
}: {
  control: Control<RewardFormData>;
  setValue: UseFormSetValue<RewardFormData>;
  statusPath: Path<RewardFormData>;
  datePath: Path<RewardFormData>;
  serverDates?: RewardDates;
}) {
  const status = useWatch<RewardFormData>({ control, name: statusPath });
  const currentDate = useWatch<RewardFormData>({ control, name: datePath });

  useEffect(() => {
    const nextDate = resolveNextDate({
      status,
      currentDate,
      serverDates,
      resolveDate: resolveRewardDate,
    });
    if (!nextDate || areDatesEqual(currentDate, nextDate)) {
      return;
    }

    setValue(datePath, nextDate, { shouldValidate: true, shouldDirty: true });
  }, [currentDate, datePath, serverDates, setValue, status]);
}

export function useQualifyConditionStatusDateSync({
  control,
  setValue,
  statusPath,
  datePath,
  serverDates,
}: {
  control: Control<PromotionFormData>;
  setValue: UseFormSetValue<PromotionFormData>;
  statusPath: Path<PromotionFormData>;
  datePath: Path<PromotionFormData>;
  serverDates?: QualifyConditionDates;
}) {
  const status = useWatch<PromotionFormData>({ control, name: statusPath });
  const currentDate = useWatch<PromotionFormData>({ control, name: datePath });

  useEffect(() => {
    const nextDate = resolveNextDate({
      status,
      currentDate,
      serverDates,
      resolveDate: resolveQualifyConditionDate,
    });
    if (!nextDate || areDatesEqual(currentDate, nextDate)) {
      return;
    }

    setValue(datePath, nextDate, { shouldValidate: true, shouldDirty: true });
  }, [currentDate, datePath, serverDates, setValue, status]);
}
