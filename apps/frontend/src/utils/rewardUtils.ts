import type { QualifyConditionType, RewardType, SelectOption } from "@matbett/shared";
import { qualifyConditionTypeOptions, rewardTypeOptions } from "@matbett/shared";

// Mapeo de tipos de recompensa a condiciones de calificación permitidas
const REWARD_TYPE_TO_QUALIFY_CONDITIONS: Record<string, QualifyConditionType[]> = {
  'FREEBET': ['DEPOSIT', 'BET'],
  'CASHBACK_FREEBET': ['LOSSES_CASHBACK'],
  'BET_BONUS_ROLLOVER': ['DEPOSIT', 'BET'],
  'BET_BONUS_NO_ROLLOVER': ['DEPOSIT', 'BET'],
  'ENHANCED_ODDS': [], // No requiere condiciones de calificación
};

// Mapeo 1:1 de RewardType a UsageConditionType (generalmente es el mismo nombre)
// Esto se usa para filtrar el select de "Tipo de Condición de Uso"
export function getFilteredRewardUsageConditionsOptions(rewardType?: string): SelectOption[] {
  if (!rewardType) return [];
  
  // En este modelo, el tipo de uso coincide con el tipo de reward
  // Ej: Reward 'FREEBET' -> UsageCondition 'FREEBET'
  // Buscamos la opción que coincida
  const matchingOption = rewardTypeOptions.find(opt => opt.value === rewardType);
  
  return matchingOption ? [matchingOption] : [];
}

/**
 * Obtiene las opciones de condiciones de calificación filtradas por tipo de recompensa
 * @param rewardType - El tipo de recompensa para filtrar las condiciones
 * @returns Array de opciones de condiciones de calificación válidas para el tipo de recompensa
 */
export function getFilteredQualifyConditionOptions(rewardType?: string) {
  if (!rewardType || !REWARD_TYPE_TO_QUALIFY_CONDITIONS[rewardType]) {
    return qualifyConditionTypeOptions;
  }

  const allowedTypes = REWARD_TYPE_TO_QUALIFY_CONDITIONS[rewardType];
  return qualifyConditionTypeOptions.filter(option =>
    allowedTypes.includes(option.value)
  );
}

/**
 * Verifica si un tipo de recompensa requiere condiciones de calificación
 * @param rewardType - El tipo de recompensa a verificar
 * @returns true si el tipo de recompensa requiere condiciones de calificación
 */
export function rewardTypeRequiresQualifyConditions(rewardType?: string): boolean {
  if (!rewardType || !REWARD_TYPE_TO_QUALIFY_CONDITIONS[rewardType]) {
    return true; // Por defecto, asumimos que sí requiere condiciones
  }
  
  return REWARD_TYPE_TO_QUALIFY_CONDITIONS[rewardType].length > 0;
}
