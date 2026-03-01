import type { Prisma } from "@prisma/client";
import type {
  BonusNoRolloverUsageConditions,
  BonusRolloverUsageConditions,
  CashbackUsageConditions,
  CasinoSpinsUsageConditions,
  EnhancedOddsUsageConditions,
  FreeBetTypeSpecificFields,
  FreeBetUsageConditions,
  Reward,
  TypeSpecificFields,
  UsageConditions,
} from "@matbett/shared";
import {
  BonusNoRolloverUsageConditionsSchema,
  BonusRolloverUsageConditionsSchema,
  CashbackUsageConditionsSchema,
  CasinoSpinsUsageConditionsSchema,
  EnhancedOddsUsageConditionsSchema,
  FreeBetTypeSpecificFieldsSchema,
  FreeBetUsageConditionsSchema,
} from "@matbett/shared";

export function parseTypeSpecificFieldsByRewardType(
  rewardType: "FREEBET",
  typeSpecificFields: Prisma.JsonValue | null
): FreeBetTypeSpecificFields;
export function parseTypeSpecificFieldsByRewardType(
  rewardType:
    | "BET_BONUS_ROLLOVER"
    | "BET_BONUS_NO_ROLLOVER"
    | "CASHBACK_FREEBET"
    | "ENHANCED_ODDS"
    | "CASINO_SPINS",
  typeSpecificFields: Prisma.JsonValue | null
): null;
export function parseTypeSpecificFieldsByRewardType(
  rewardType: Reward["type"],
  typeSpecificFields: Prisma.JsonValue | null
): TypeSpecificFields {
  if (rewardType === "FREEBET") {
    return typeSpecificFields
      ? FreeBetTypeSpecificFieldsSchema.parse(typeSpecificFields)
      : { stakeNotReturned: true };
  }
  return null;
}

export function parseUsageConditionsByRewardType(
  rewardType: "FREEBET",
  usageConditions: Prisma.JsonValue | null
): FreeBetUsageConditions;
export function parseUsageConditionsByRewardType(
  rewardType: "BET_BONUS_ROLLOVER",
  usageConditions: Prisma.JsonValue | null
): BonusRolloverUsageConditions;
export function parseUsageConditionsByRewardType(
  rewardType: "BET_BONUS_NO_ROLLOVER",
  usageConditions: Prisma.JsonValue | null
): BonusNoRolloverUsageConditions;
export function parseUsageConditionsByRewardType(
  rewardType: "CASHBACK_FREEBET",
  usageConditions: Prisma.JsonValue | null
): CashbackUsageConditions;
export function parseUsageConditionsByRewardType(
  rewardType: "ENHANCED_ODDS",
  usageConditions: Prisma.JsonValue | null
): EnhancedOddsUsageConditions;
export function parseUsageConditionsByRewardType(
  rewardType: "CASINO_SPINS",
  usageConditions: Prisma.JsonValue | null
): CasinoSpinsUsageConditions;
export function parseUsageConditionsByRewardType(
  rewardType: Reward["type"],
  usageConditions: Prisma.JsonValue | null
): UsageConditions {
  switch (rewardType) {
    case "FREEBET":
      return FreeBetUsageConditionsSchema.parse(usageConditions);
    case "BET_BONUS_ROLLOVER":
      return BonusRolloverUsageConditionsSchema.parse(usageConditions);
    case "BET_BONUS_NO_ROLLOVER":
      return BonusNoRolloverUsageConditionsSchema.parse(usageConditions);
    case "CASHBACK_FREEBET":
      return CashbackUsageConditionsSchema.parse(usageConditions);
    case "ENHANCED_ODDS":
      return EnhancedOddsUsageConditionsSchema.parse(usageConditions);
    case "CASINO_SPINS":
      return CasinoSpinsUsageConditionsSchema.parse(usageConditions);
    default:
      throw new Error(`Tipo de Reward no soportado: ${String(rewardType)}`);
  }
}
