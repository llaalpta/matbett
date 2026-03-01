import { qualifyConditionTypeOptions, rewardTypeOptions } from "@matbett/shared";
import type { QualifyConditionType, SelectOption } from "@matbett/shared";

// Mapeo de tipos de recompensa a condiciones de calificacion permitidas
const REWARD_TYPE_TO_QUALIFY_CONDITIONS: Record<string, QualifyConditionType[]> = {
  FREEBET: ["DEPOSIT", "BET"],
  CASHBACK_FREEBET: ["LOSSES_CASHBACK"],
  BET_BONUS_ROLLOVER: ["DEPOSIT", "BET"],
  BET_BONUS_NO_ROLLOVER: ["DEPOSIT", "BET"],
  CASINO_SPINS: ["DEPOSIT", "BET"],
  ENHANCED_ODDS: [], // No requiere condiciones de calificacion
};

// Mapeo 1:1 de RewardType a UsageConditionType (generalmente es el mismo nombre)
// Esto se usa para filtrar el select de "Tipo de Condicion de Uso"
export function getFilteredRewardUsageConditionsOptions(
  rewardType?: string
): SelectOption[] {
  if (!rewardType) {
    return [];
  }

  const matchingOption = rewardTypeOptions.find(
    (option) => option.value === rewardType
  );

  return matchingOption ? [matchingOption] : [];
}

/**
 * Obtiene las opciones de condiciones de calificacion filtradas por tipo de recompensa
 */
export function getFilteredQualifyConditionOptions(rewardType?: string) {
  if (!rewardType || !REWARD_TYPE_TO_QUALIFY_CONDITIONS[rewardType]) {
    return qualifyConditionTypeOptions;
  }

  const allowedTypes = REWARD_TYPE_TO_QUALIFY_CONDITIONS[rewardType];
  return qualifyConditionTypeOptions.filter((option) =>
    allowedTypes.includes(option.value)
  );
}

/**
 * Verifica si un tipo de recompensa requiere condiciones de calificacion
 */
export function rewardTypeRequiresQualifyConditions(
  rewardType?: string
): boolean {
  if (!rewardType || !REWARD_TYPE_TO_QUALIFY_CONDITIONS[rewardType]) {
    return true;
  }

  return REWARD_TYPE_TO_QUALIFY_CONDITIONS[rewardType].length > 0;
}
