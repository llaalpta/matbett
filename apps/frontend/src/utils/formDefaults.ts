import {
  PromotionSchema,
  RewardSchema,
  type AbsoluteTimeframe,
  type QualifyConditionType,
} from "@matbett/shared";

import type {
  PromotionFormData,
  PromotionServerModel,
  PhaseFormData,
  RewardQualifyConditionFormData,
  RewardFormData,
  PhaseServerModel,
  RewardServerModel,
  RewardQualifyConditionServerModel,
} from "@/types/hooks";

// =============================================
// CONSTANTS
// =============================================

const createClientId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const ensureClientId = (id?: string, clientId?: string): string | undefined =>
  clientId ?? (id ? undefined : createClientId());

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const buildAbsoluteTimeframeFrom = (start = new Date()): AbsoluteTimeframe => ({
  mode: "ABSOLUTE",
  start,
  end: addDays(start, 7),
});

export const DEFAULT_ABSOLUTE_TIMEFRAME: AbsoluteTimeframe =
  buildAbsoluteTimeframeFrom();

// =============================================
// DEFAULT VALUES BUILDERS
// =============================================

const createBlankPromotion = (): PromotionFormData => ({
  clientId: createClientId(),
  name: "",
  description: "",
  bookmakerAccountId: "",
  status: "NOT_STARTED",
  statusDate: new Date(),
  cardinality: "SINGLE",
  activationMethod: "AUTOMATIC",
  availableQualifyConditions: [],
  timeframe: buildAbsoluteTimeframeFrom(),
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
    const parsed = result.data;
    return {
      ...parsed,
      clientId: ensureClientId(parsed.id, parsed.clientId),
      availableQualifyConditions: parsed.availableQualifyConditions.map((qc) => ({
        ...qc,
        clientId: ensureClientId(qc.id, qc.clientId),
      })),
      phases: parsed.phases.map((phase) => ({
        ...phase,
        clientId: ensureClientId(phase.id, phase.clientId),
        rewards: phase.rewards.map((reward) => ({
          ...reward,
          clientId: ensureClientId(reward.id, reward.clientId),
          qualifyConditions: reward.qualifyConditions.map((qc) => ({
            ...qc,
            clientId: ensureClientId(qc.id, qc.clientId),
          })),
        })),
      })),
    };
  } else {
    console.error(
      "Zod validation failed for initial promotion data:",
      result.error.flatten()
    );
    // Fallback to a blank form if server data is malformed.
    return createBlankPromotion();
  }
};

export const buildDefaultAbsoluteTimeframe = (): AbsoluteTimeframe =>
  buildAbsoluteTimeframeFrom();

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
  clientId: ensureClientId(phaseData?.id, phaseData?.clientId),
  name: phaseData?.name || "",
  description: phaseData?.description || "",
  status: phaseData?.status || "NOT_STARTED",
  statusDate: phaseData?.statusDate ?? new Date(),
  timeframe: phaseData?.timeframe || buildDefaultAbsoluteTimeframe(),
  activationMethod: phaseData?.activationMethod || "AUTOMATIC",
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
        rewardData.qualifyConditions
      );
    }

    const fallbackReward = buildDefaultReward(rewardData.type);
    return RewardSchema.parse({
      // IDs: se mantienen para edición
      id: rewardData.id,
      clientId: ensureClientId(rewardData.id, rewardData.clientId),

      // Campos editables: del servidor
      type: rewardData.type,
      value: rewardData.value ?? 0,
      valueType: rewardData.valueType ?? "FIXED",
      activationMethod: rewardData.activationMethod ?? "AUTOMATIC",
      claimMethod: rewardData.claimMethod ?? "AUTOMATIC",
      activationRestrictions: rewardData.activationRestrictions,
      claimRestrictions: rewardData.claimRestrictions,
      withdrawalRestrictions: rewardData.withdrawalRestrictions,
      status: rewardData.status ?? "QUALIFYING",
      statusDate: rewardData.statusDate ?? new Date(),
      // El timeframe se determina por qualifyConditions y usageConditions

      // Campos anidados: se procesan recursivamente
      qualifyConditions,
      typeSpecificFields: rewardData.typeSpecificFields ?? fallbackReward.typeSpecificFields,
      usageConditions: rewardData.usageConditions ?? fallbackReward.usageConditions,

      // Campos calculados: NO se cargan
    });
  }

  // Si no hay datos del servidor, usar defaults por tipo
  const baseQualifyConditions: RewardQualifyConditionFormData[] = [];
  const baseReward = {
    clientId: createClientId(),
    type,
    value: 0,
    valueType: "FIXED" as const,
    activationMethod: "AUTOMATIC" as const,
    claimMethod: "AUTOMATIC" as const,
    activationRestrictions: undefined,
    claimRestrictions: undefined,
    withdrawalRestrictions: undefined,
    status: "QUALIFYING" as const,
    statusDate: new Date(),
    qualifyConditions: baseQualifyConditions,
  };

  switch (type) {
    case "FREEBET":
      return RewardSchema.parse({
        ...baseReward,
        typeSpecificFields: {
          stakeNotReturned: true, // SNR: en typeSpecificFields, no en usageConditions
          retentionRate: 75,
        },
        usageConditions: {
          type: "FREEBET",
          timeframe: {
            mode: "ABSOLUTE",
            start: new Date(),
            end: addDays(new Date(), 7),
          } satisfies AbsoluteTimeframe,
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
      });

    case "CASHBACK_FREEBET":
      return RewardSchema.parse({
        ...baseReward,
        type: "CASHBACK_FREEBET",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "CASHBACK_FREEBET",
          timeframe: {
            mode: "ABSOLUTE",
            start: new Date(),
            end: addDays(new Date(), 7),
          } satisfies AbsoluteTimeframe,
          // Restricciones de apuesta (con stake y outcome)
          ...buildDefaultRolloverBetRestrictions(),
        },
      });

    case "BET_BONUS_ROLLOVER":
      return RewardSchema.parse({
        ...baseReward,
        type: "BET_BONUS_ROLLOVER",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "BET_BONUS_ROLLOVER",
          timeframe: {
            mode: "ABSOLUTE",
            start: new Date(),
            end: addDays(new Date(), 7),
          } satisfies AbsoluteTimeframe,
          // Configuración del rollover
          multiplier: 1,
          maxConversionMultiplier: undefined,
          expectedLossPercentage: 5,
          bonusCanBeUsedForBetting: true,
          minBetsRequired: undefined,
          // Restricciones de dinero/retiro
          rolloverContributionWallet: "MIXED",
          realMoneyUsageRatio: 50,
          noWithdrawalsAllowedDuringRollover: false,
          bonusCancelledOnWithdrawal: false,
          allowDepositsAfterActivation: true,
          returnedBetsCountForRollover: false,
          cashoutBetsCountForRollover: false,
          requireResolvedWithinTimeframe: true,
          countOnlySettledBets: true,
          maxConvertibleAmount: undefined,
          // Restricciones de apuesta (con stake y outcome)
          ...buildDefaultRolloverBetRestrictions(),
        },
      });

    case "BET_BONUS_NO_ROLLOVER":
      return RewardSchema.parse({
        ...baseReward,
        type: "BET_BONUS_NO_ROLLOVER",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "BET_BONUS_NO_ROLLOVER",
          timeframe: {
            mode: "ABSOLUTE",
            start: new Date(),
            end: addDays(new Date(), 7),
          } satisfies AbsoluteTimeframe,
          maxConversionMultiplier: undefined,
          maxConvertibleAmount: undefined,
          // Reglas de computo/validez
          returnedBetsCountForUsage: false,
          cashoutBetsCountForUsage: false,
          requireResolvedWithinTimeframe: true,
          countOnlySettledBets: true,
          onlyFirstBetCounts: false,
          // Restricciones de apuesta (con stake y outcome)
          ...buildDefaultBaseBetRestrictions(),
          stakeRestriction: {
            minStake: undefined,
            maxStake: undefined,
          },
          requiredBetOutcome: "ANY",
        },
      });

    case "ENHANCED_ODDS":
      return RewardSchema.parse({
        ...baseReward,
        type: "ENHANCED_ODDS",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "ENHANCED_ODDS",
          timeframe: {
            mode: "PROMOTION",
          },
          normalOdds: 0,
          enhancedOdds: 0,
          enhancedOddsMode: "FIXED",
          enhancementPercentage: undefined,
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
          allowLiveOddsChanges: false,
          betTypeRestrictions: undefined,
          selectionRestrictions: undefined,
          otherRestrictions: undefined,
        },
      });

    case "CASINO_SPINS":
      return RewardSchema.parse({
        ...baseReward,
        type: "CASINO_SPINS",
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: {
          type: "CASINO_SPINS",
          timeframe: {
            mode: "ABSOLUTE",
            start: new Date(),
            end: addDays(new Date(), 7),
          } satisfies AbsoluteTimeframe,
          spinsCount: 1,
          gameTitle: undefined,
          // Sin restricciones de apuesta (no aplica a casino)
        },
      });

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

  if (typeof contributesToRewardValueOrData === "boolean") {
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
    clientId: ensureClientId(conditionData?.id, conditionData?.clientId),

    // Campos editables: del servidor o defaults
    description: conditionData?.description || "",
    status: conditionData?.status || ("PENDING" as const),
    statusDate: conditionData?.statusDate ?? new Date(),
    timeframe:
      conditionData?.timeframe ||
      ({
        mode: "ABSOLUTE",
        start: new Date(),
        end: addDays(new Date(), 7),
      } satisfies AbsoluteTimeframe),

    // Campos calculados: NO se cargan, quedan undefined
    // depositRecordIds, betRecordIds, generatedRewardIds se omiten
  };

  switch (type) {
    case "DEPOSIT": {
      const depositConditions =
        conditionData && conditionData.type === "DEPOSIT"
          ? conditionData.conditions
          : undefined;

      // Discriminador: Usar parámetro si se proporciona, sino del servidor, sino default a FIXED (false)
      const finalContributesToRewardValue =
        contributesToRewardValue ??
        depositConditions?.contributesToRewardValue ??
        false;

      // Campos comunes
      const commonDepositFields = {
        depositCode: depositConditions?.depositCode ?? "",
        firstDepositOnly: depositConditions?.firstDepositOnly ?? true,
        otherRestrictions: depositConditions?.otherRestrictions ?? "",
      };

      return {
        type: "DEPOSIT",
        ...baseCondition,
        conditions: finalContributesToRewardValue
          ? {
              // CALCULATED VALUE: "Deposita mínimo X€, recibe Y% bonus, máximo Z€"
              contributesToRewardValue: true,
              ...commonDepositFields,
              minAmount:
                depositConditions && "minAmount" in depositConditions
                  ? (depositConditions.minAmount ?? undefined)
                  : undefined,
              maxAmount:
                depositConditions && "maxAmount" in depositConditions
                  ? depositConditions.maxAmount
                  : undefined,
              bonusPercentage:
                depositConditions && "bonusPercentage" in depositConditions
                  ? (depositConditions.bonusPercentage ?? undefined)
                  : undefined,
              maxBonusAmount:
                depositConditions && "maxBonusAmount" in depositConditions
                  ? (depositConditions.maxBonusAmount ?? undefined)
                  : undefined,
            }
          : {
              // FIXED VALUE: "Deposita X€ exactos"
              contributesToRewardValue: false,
              ...commonDepositFields,
              targetAmount:
                depositConditions && "targetAmount" in depositConditions
                  ? (depositConditions.targetAmount ?? undefined)
                  : undefined,
            },
      };
    }

    case "BET": {
      const betConditions =
        conditionData && conditionData.type === "BET"
          ? conditionData.conditions
          : undefined;

      // Discriminador: Usar parámetro si se proporciona, sino del servidor, sino default a FIXED (false)
      const finalContributesToRewardValue =
        contributesToRewardValue ??
        betConditions?.contributesToRewardValue ??
        false;

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
        otherRestrictions: betConditions?.otherRestrictions ?? "",
      };

      return {
        type: "BET",
        ...baseCondition,
        conditions: finalContributesToRewardValue
          ? {
              // CALCULATED VALUE: "Apuesta mínimo X€, recibe Y%, máximo Z€"
              contributesToRewardValue: true,
              ...commonBetFields,
              stakeRestriction:
                betConditions && "stakeRestriction" in betConditions
                  ? {
                      minStake:
                        betConditions.stakeRestriction.minStake ?? undefined,
                      maxStake: betConditions.stakeRestriction.maxStake,
                    }
                  : {
                      minStake: undefined,
                      maxStake: undefined,
                    },
              returnPercentage:
                betConditions && "returnPercentage" in betConditions
                  ? (betConditions.returnPercentage ?? undefined)
                  : undefined,
              maxRewardAmount:
                betConditions && "maxRewardAmount" in betConditions
                  ? (betConditions.maxRewardAmount ?? undefined)
                  : undefined,
            }
          : {
              // FIXED VALUE: "Apuesta X€ exactos"
              contributesToRewardValue: false,
              ...commonBetFields,
              targetStake:
                betConditions && "targetStake" in betConditions
                  ? (betConditions.targetStake ?? undefined)
                  : undefined,
            },
      };
    }

    case "LOSSES_CASHBACK": {
      const lossesConditions =
        conditionData && conditionData.type === "LOSSES_CASHBACK"
          ? conditionData.conditions
          : undefined;

      return {
        type: "LOSSES_CASHBACK",
        ...baseCondition,
        conditions: {
          cashbackPercentage: lossesConditions?.cashbackPercentage ?? 100,
          maxCashbackAmount: lossesConditions?.maxCashbackAmount ?? 50,
          calculationMethod: lossesConditions?.calculationMethod ?? "NET_LOSS",
          calculationPeriod: lossesConditions?.calculationPeriod,
          returnedBetsCountForCashback:
            lossesConditions?.returnedBetsCountForCashback ?? false,
          cashoutBetsCountForCashback:
            lossesConditions?.cashoutBetsCountForCashback ?? false,
          countOnlySettledBets:
            lossesConditions?.countOnlySettledBets ?? true,
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
          otherRestrictions: lossesConditions?.otherRestrictions ?? "",
        },
      };
    }

    default:
      throw new Error(`Tipo de qualify condition no soportado: ${type}`);
  }
}

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
  otherRestrictions: undefined,
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

