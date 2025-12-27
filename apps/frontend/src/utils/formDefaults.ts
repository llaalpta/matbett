import {
  PromotionSchema,
  type AbsoluteTimeframe,
  type QualifyConditionType,
} from '@matbett/shared';

import type {
  PromotionFormData,
  PromotionServerModel,
  PhaseFormData,
  RewardQualifyConditionFormData,
  RewardFormData,
  PhaseServerModel,
  RewardServerModel,
  RewardQualifyConditionServerModel,
} from '@/types/hooks';


// =============================================
// CONSTANTS
// =============================================

export const DEFAULT_ABSOLUTE_TIMEFRAME: AbsoluteTimeframe = {
  mode: 'ABSOLUTE', // Literal type matches enum value
  start: new Date(),
  end: undefined,
};

// =============================================
// DEFAULT VALUES BUILDERS
// =============================================

const createBlankPromotion = (): PromotionFormData => ({
  name: '',
  description: '',
  bookmaker: undefined,
  status: 'NOT_STARTED',
  cardinality: 'SINGLE',
  activationMethod: 'AUTOMATIC',
  timeframe: {
    mode: 'ABSOLUTE',
    start: new Date(),
    end: undefined,
  },
  phases: [buildDefaultPhase()],
});

/**
 * Parses raw server data with the PromotionSchema or returns a blank default.
 * This is the new single point of transformation from API data to form data.
 */
export const buildDefaultPromotion = (
  serverData?: PromotionServerModel
): PromotionFormData => {
  if (!serverData) {
    return createBlankPromotion();
  }

  // Safely parse the raw data from the server.
  const result = PromotionSchema.safeParse(serverData);

  if (result.success) {
    return result.data; // Return the fully typed, parsed data
  } else {
    console.error(
      'Zod validation failed for initial promotion data:',
      result.error.flatten()
    );
    // Fallback to a blank form if server data is malformed.
    return createBlankPromotion();
  }
};

export const buildDefaultAbsoluteTimeframe = (): AbsoluteTimeframe => ({
  mode: 'ABSOLUTE',
  start: new Date(),
  end: undefined,
});

export const buildDefaultPhases = (
  phasesData?: PhaseServerModel[]
): PhaseFormData[] => {
  if (!phasesData || phasesData.length === 0) {
    return [buildDefaultPhase()];
  }
  return phasesData.map((phase) => buildDefaultPhase(phase));
};

export const buildDefaultPhase = (
  phaseData?: PhaseServerModel
): PhaseFormData => ({
  id: phaseData?.id,
  name: phaseData?.name || "",
  description: phaseData?.description || "",
  status: phaseData?.status || "NOT_STARTED",
  timeframe: phaseData?.timeframe || buildDefaultAbsoluteTimeframe(),
  activationMethod: phaseData?.activationMethod || "AUTOMATIC",
  availableQualifyConditions: buildDefaultQualifyConditions(
    phaseData?.availableQualifyConditions
  ),
  rewards: buildDefaultRewards(phaseData?.rewards),
});

export const buildDefaultRewards = (
  rewardsData?: RewardServerModel[]
): RewardFormData[] => {
  if (!rewardsData || rewardsData.length === 0) {
    return [buildDefaultReward("FREEBET")];
  }
  return rewardsData.map((reward) => buildDefaultReward(reward.type, reward));
};

export const buildDefaultQualifyConditions = (
  conditionsData?: RewardQualifyConditionServerModel[]
): RewardQualifyConditionFormData[] => {
  if (!conditionsData || conditionsData.length === 0) {
    return [];
  }
  return conditionsData.map((condition) =>
    buildDefaultQualifyCondition(condition.type, condition)
  );
};

// =============================================
// REWARD BUILDERS BY TYPE
// =============================================

export const buildDefaultReward = (
  type: string,
  rewardData?: RewardServerModel
): RewardFormData => {
  // Si tenemos datos del servidor, procesamos según su tipo específico
  if (rewardData) {
    // Extraer qualifyConditions basado en el tipo específico
    let qualifyConditions: RewardQualifyConditionFormData[] = [];

    if ("qualifyConditions" in rewardData && rewardData.qualifyConditions) {
      qualifyConditions = buildDefaultQualifyConditions(
        rewardData.qualifyConditions as RewardQualifyConditionServerModel[]
      );
    }

    return {
      // IDs: se mantienen para edición
      id: rewardData.id,

      // Campos editables: del servidor
      type: rewardData.type,
      value: rewardData.value,
      valueType: rewardData.valueType,
      activationMethod: rewardData.activationMethod,
      claimMethod: rewardData.claimMethod,
      claimRestrictions: rewardData.claimRestrictions,
      status: rewardData.status,
      // ❌ timeframe removido - Ver arquitectura en CLAUDE.md Pattern #11-13
      // El timeframe se determina por qualifyConditions y usageConditions

      // Campos anidados: se procesan recursivamente
      qualifyConditions,
      usageConditions: rewardData.usageConditions,
      // ❌ usageTracking removido - solo en ServerModel (OUTPUT), no en FormData (INPUT)

      // Campos calculados: NO se cargan
    } as RewardFormData;
  }

  // Si no hay datos del servidor, usar defaults por tipo
  const baseReward = {
    type,
    value: undefined,
    valueType: "FIXED" as const,
    activationMethod: "AUTOMATIC" as const,
    claimMethod: "AUTOMATIC" as const,
    claimRestrictions: undefined,
    status: "QUALIFYING" as const,
    qualifyConditions: [],
  };

  switch (type) {
    case "FREEBET":
      return {
        ...baseReward,
        typeSpecificFields: {
          stakeNotReturned: true, // SNR: en typeSpecificFields, no en usageConditions
        },
        usageConditions: {
          type: "FREEBET",
          timeframe: {
            mode: 'ABSOLUTE',
            start: new Date(),
            end: undefined,
          } as AbsoluteTimeframe,
          // Comportamiento de uso
          mustUseComplete: true,
          voidConsumesBalance: true,
          lockWinningsUntilFullyUsed: false,
          // Restricciones de apuesta (aplanadas, sin wrapper betConditions)
          ...buildDefaultBaseBetRestrictions(),
          // Stake restriction (solo aplica si mustUseComplete=false)
          stakeRestriction: {
            minStake: undefined,
            maxStake: undefined,
          },
        },
      } as Partial<RewardFormData> as RewardFormData;

    case "CASHBACK_FREEBET":
      return {
        ...baseReward,
        type: "CASHBACK_FREEBET",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "CASHBACK_FREEBET",
          timeframe: {
            mode: 'ABSOLUTE',
            start: new Date(),
            end: undefined,
          } as AbsoluteTimeframe,
          cashbackPercentage: undefined,
          maxCashbackAmount: undefined,
          // Restricciones de apuesta (con stake y outcome)
          ...buildDefaultRolloverBetRestrictions(),
        },
      } as Partial<RewardFormData> as RewardFormData;

    case "BET_BONUS_ROLLOVER":
      return {
        ...baseReward,
        type: "BET_BONUS_ROLLOVER",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "BET_BONUS_ROLLOVER",
          timeframe: {
            mode: 'ABSOLUTE',
            start: new Date(),
            end: undefined,
          } as AbsoluteTimeframe,
          // Configuración del rollover
          multiplier: undefined,
          maxConversionMultiplier: undefined,
          expectedLossPercentage: undefined,
          bonusCanBeUsedForBetting: true,
          minBetsRequired: undefined,
          // Restricciones de dinero/retiro
          onlyBonusMoneyCountsForRollover: false,
          onlyRealMoneyCountsForRollover: false,
          noWithdrawalsAllowedDuringRollover: false,
          bonusCancelledOnWithdrawal: false,
          allowDepositsAfterActivation: true,
          // Restricciones de apuesta (con stake y outcome)
          ...buildDefaultRolloverBetRestrictions(),
        },
      } as Partial<RewardFormData> as RewardFormData;

    case "BET_BONUS_NO_ROLLOVER":
      return {
        ...baseReward,
        type: "BET_BONUS_NO_ROLLOVER",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "BET_BONUS_NO_ROLLOVER",
          timeframe: {
            mode: 'ABSOLUTE',
            start: new Date(),
            end: undefined,
          } as AbsoluteTimeframe,
          maxConversionMultiplier: undefined,
          // Restricciones de apuesta (con stake, sin outcome)
          ...buildDefaultBaseBetRestrictions(),
          stakeRestriction: {
            minStake: undefined,
            maxStake: undefined,
          },
        },
      } as Partial<RewardFormData> as RewardFormData;

    case "ENHANCED_ODDS":
      return {
        ...baseReward,
        type: "ENHANCED_ODDS",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "ENHANCED_ODDS",
          timeframe: {
            mode: 'ABSOLUTE',
            start: new Date(),
            end: undefined,
          } as AbsoluteTimeframe,
          normalOdds: undefined,
          enhancedOdds: undefined,
          // Restricciones de apuesta (con stake)
          stakeRestriction: {
            minStake: undefined,
            maxStake: undefined,
          },
          allowMultipleBets: false,
          multipleBetCondition: {
            minSelections: undefined,
            maxSelections: undefined,
            minOddsPerSelection: undefined,
            maxOddsPerSelection: undefined,
            systemType: undefined,
          },
          betTypeRestrictions: undefined,
          selectionRestrictions: undefined,
        },
      } as Partial<RewardFormData> as RewardFormData;

    case "CASINO_SPINS":
      return {
        ...baseReward,
        type: "CASINO_SPINS",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "CASINO_SPINS",
          timeframe: {
            mode: 'ABSOLUTE',
            start: new Date(),
            end: undefined,
          } as AbsoluteTimeframe,
          spinsCount: undefined,
          gameTitle: undefined,
          // Sin restricciones de apuesta (no aplica a casino)
        },
      } as Partial<RewardFormData> as RewardFormData;

    default:
      throw new Error(`Tipo de reward no soportado: ${type}`);
  }
};

// =============================================
// QUALIFY CONDITION BUILDERS BY TYPE
// =============================================

// Function overloads for type-safe returns based on condition type
export function buildDefaultQualifyCondition(
  type: "DEPOSIT",
  contributesToRewardValueOrData?: boolean | RewardQualifyConditionServerModel,
  conditionData?: RewardQualifyConditionServerModel
): Extract<RewardQualifyConditionFormData, { type: "DEPOSIT" }>;

export function buildDefaultQualifyCondition(
  type: "BET",
  contributesToRewardValueOrData?: boolean | RewardQualifyConditionServerModel,
  conditionData?: RewardQualifyConditionServerModel
): Extract<RewardQualifyConditionFormData, { type: "BET" }>;

export function buildDefaultQualifyCondition(
  type: "LOSSES_CASHBACK",
  contributesToRewardValueOrData?: boolean | RewardQualifyConditionServerModel,
  conditionData?: RewardQualifyConditionServerModel
): Extract<RewardQualifyConditionFormData, { type: "LOSSES_CASHBACK" }>;

// General overload for union type (used when mapping)
export function buildDefaultQualifyCondition(
  type: QualifyConditionType,
  contributesToRewardValueOrData?: boolean | RewardQualifyConditionServerModel,
  conditionData?: RewardQualifyConditionServerModel
): RewardQualifyConditionFormData;

// Implementation signature (must match all overloads)
export function buildDefaultQualifyCondition(
  type: QualifyConditionType,
  contributesToRewardValueOrData?: boolean | RewardQualifyConditionServerModel,
  conditionData?: RewardQualifyConditionServerModel
): RewardQualifyConditionFormData {
  // Parse arguments: support both old signature (type, conditionData) and new signature (type, boolean, conditionData)
  let contributesToRewardValue: boolean | undefined;
  let actualConditionData: RewardQualifyConditionServerModel | undefined;

  if (typeof contributesToRewardValueOrData === 'boolean') {
    // New signature: buildDefaultQualifyCondition(type, boolean, conditionData?)
    contributesToRewardValue = contributesToRewardValueOrData;
    actualConditionData = conditionData;
  } else {
    // Old signature: buildDefaultQualifyCondition(type, conditionData?)
    contributesToRewardValue = undefined;
    actualConditionData = contributesToRewardValueOrData;
  }

  // Use actualConditionData for the rest of the function
  conditionData = actualConditionData;
  const baseCondition = {
    // IDs: se mantienen para edición, undefined para creación
    id: conditionData?.id,

    // Campos editables: del servidor o defaults
    description: conditionData?.description || "",
    otherRestrictions: conditionData?.otherRestrictions || "",
    status: conditionData?.status || ("PENDING" as const),
    timeframe:
      conditionData?.timeframe ||
      ({
        mode: 'ABSOLUTE',
        start: new Date(),
        end: undefined,
      } as AbsoluteTimeframe),
    dependsOnQualifyConditionId: conditionData?.dependsOnQualifyConditionId,

    // ❌ tracking removido - solo en ServerModel (OUTPUT), no en FormData (INPUT)

    // Campos calculados: NO se cargan, quedan undefined
    // depositRecordIds, betRecordIds, generatedRewardIds se omiten
  };

  switch (type) {
    case "DEPOSIT": {
      const depositConditions = conditionData && conditionData.type === 'DEPOSIT'
        ? conditionData.conditions
        : undefined;

      // Discriminador: Usar parámetro si se proporciona, sino del servidor, sino default a FIXED (false)
      const finalContributesToRewardValue = contributesToRewardValue ?? depositConditions?.contributesToRewardValue ?? false;

      // Campos comunes
      const commonDepositFields = {
        depositCode: depositConditions?.depositCode ?? "",
        firstDepositOnly: depositConditions?.firstDepositOnly ?? true,
      };

      return {
        type: "DEPOSIT",
        ...baseCondition,
        conditions: finalContributesToRewardValue ? {
          // CALCULATED VALUE: "Deposita mínimo X€, recibe Y% bonus, máximo Z€"
          contributesToRewardValue: true,
          ...commonDepositFields,
          minAmount: depositConditions && 'minAmount' in depositConditions
            ? (depositConditions.minAmount ?? undefined)
            : undefined,
          maxAmount: depositConditions && 'maxAmount' in depositConditions
            ? depositConditions.maxAmount
            : undefined,
          bonusPercentage: depositConditions && 'bonusPercentage' in depositConditions
            ? (depositConditions.bonusPercentage ?? undefined)
            : undefined,
          maxBonusAmount: depositConditions && 'maxBonusAmount' in depositConditions
            ? (depositConditions.maxBonusAmount ?? undefined)
            : undefined,
        } : {
          // FIXED VALUE: "Deposita X€ exactos"
          contributesToRewardValue: false,
          ...commonDepositFields,
          targetAmount: depositConditions && 'targetAmount' in depositConditions
            ? (depositConditions.targetAmount ?? undefined)
            : undefined,
        },
      };
    }

    case "BET": {
      const betConditions = conditionData && conditionData.type === 'BET'
        ? conditionData.conditions
        : undefined;

      // Discriminador: Usar parámetro si se proporciona, sino del servidor, sino default a FIXED (false)
      const finalContributesToRewardValue = contributesToRewardValue ?? betConditions?.contributesToRewardValue ?? false;

      // Campos comunes a ambos tipos (FIXED y CALCULATED)
      const commonBetFields = {
        allowRetries: betConditions?.allowRetries ?? false,
        maxAttempts: betConditions?.maxAttempts ?? 1,
        oddsRestriction: betConditions?.oddsRestriction ?? {
          minOdds: undefined,
          maxOdds: undefined,
        },
        requiredBetOutcome: betConditions?.requiredBetOutcome ?? "ANY",
        allowMultipleBets: betConditions?.allowMultipleBets ?? false,
        multipleBetCondition: betConditions?.multipleBetCondition ?? {
          minSelections: undefined,
          maxSelections: undefined,
          minOddsPerSelection: undefined,
          maxOddsPerSelection: undefined,
          systemType: undefined,
        },
        allowLiveOddsChanges: betConditions?.allowLiveOddsChanges ?? false,
        betTypeRestrictions: betConditions?.betTypeRestrictions,
        selectionRestrictions: betConditions?.selectionRestrictions,
        onlyFirstBetCounts: betConditions?.onlyFirstBetCounts ?? false,
      };

      return {
        type: "BET",
        ...baseCondition,
        conditions: finalContributesToRewardValue ? {
          // CALCULATED VALUE: "Apuesta mínimo X€, recibe Y%, máximo Z€"
          contributesToRewardValue: true,
          ...commonBetFields,
          stakeRestriction: betConditions && 'stakeRestriction' in betConditions ? {
            minStake: betConditions.stakeRestriction.minStake ?? undefined,
            maxStake: betConditions.stakeRestriction.maxStake,
          } : {
            minStake: undefined,
            maxStake: undefined,
          },
          returnPercentage: betConditions && 'returnPercentage' in betConditions
            ? (betConditions.returnPercentage ?? undefined)
            : undefined,
          maxRewardAmount: betConditions && 'maxRewardAmount' in betConditions
            ? (betConditions.maxRewardAmount ?? undefined)
            : undefined,
        } : {
          // FIXED VALUE: "Apuesta X€ exactos"
          contributesToRewardValue: false,
          ...commonBetFields,
          targetStake: betConditions && 'targetStake' in betConditions
            ? (betConditions.targetStake ?? undefined)
            : undefined,
        },
      };
    }

    case "LOSSES_CASHBACK": {
      const lossesConditions = conditionData && conditionData.type === 'LOSSES_CASHBACK'
        ? conditionData.conditions
        : undefined;

      return {
        type: "LOSSES_CASHBACK",
        ...baseCondition,
        conditions: {
          cashbackPercentage: lossesConditions?.cashbackPercentage ?? 0.1,
          maxCashbackAmount: lossesConditions?.maxCashbackAmount ?? 50,
          calculationMethod: lossesConditions?.calculationMethod ?? "NET_LOSSES",
          calculationPeriod: lossesConditions?.calculationPeriod,
          // Campos aplanados de BetConditionsSchema (opcionales)
          oddsRestriction: lossesConditions?.oddsRestriction,
          stakeRestriction: lossesConditions?.stakeRestriction,
          requiredBetOutcome: lossesConditions?.requiredBetOutcome,
          allowMultipleBets: lossesConditions?.allowMultipleBets,
          multipleBetCondition: lossesConditions?.multipleBetCondition,
          allowLiveOddsChanges: lossesConditions?.allowLiveOddsChanges,
          betTypeRestrictions: lossesConditions?.betTypeRestrictions,
          selectionRestrictions: lossesConditions?.selectionRestrictions,
          onlyFirstBetCounts: lossesConditions?.onlyFirstBetCounts,
        },
      };
    }

    default:
      throw new Error(`Tipo de qualify condition no soportado: ${type}`);
  }
};

// =============================================
// HELPER BUILDERS
// =============================================

/**
 * Campos base de restricciones de apuesta (sin stake ni outcome)
 * Usado para FREEBET usageConditions
 */
export const buildDefaultBaseBetRestrictions = () => ({
  oddsRestriction: {
    minOdds: undefined,
    maxOdds: undefined,
  },
  allowMultipleBets: false,
  multipleBetCondition: {
    minSelections: undefined,
    maxSelections: undefined,
    minOddsPerSelection: undefined,
    maxOddsPerSelection: undefined,
    systemType: undefined,
  },
  allowLiveOddsChanges: false,
  betTypeRestrictions: undefined,
  selectionRestrictions: undefined,
});

/**
 * Restricciones para Rollover (con stake y outcome, sin onlyFirstBetCounts)
 */
export const buildDefaultRolloverBetRestrictions = () => ({
  ...buildDefaultBaseBetRestrictions(),
  stakeRestriction: {
    minStake: undefined,
    maxStake: undefined,
  },
  requiredBetOutcome: "ANY" as const,
});