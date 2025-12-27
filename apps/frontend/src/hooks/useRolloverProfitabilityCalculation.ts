import { useMemo } from "react";

import type { ProfitabilityAnalysis } from "@/types/calculators";

interface RolloverCalculationParams {
  bonusValue: number;
  multiplier?: number; // Opcional para formularios, obligatorio para cálculo
  maxConversionMultiplier?: number; // Opcional para formularios, obligatorio para cálculo
  // Campos aplanados de betConditions (estructura antigua eliminada)
  minOdds?: number; // De oddsRestriction.minOdds
  maxStake?: number; // De stakeRestriction.maxStake
  depositRequired?: number;
  expectedLossPercentage?: number; // % de pérdida real por diferencia de cuotas
  onlyBonusMoneyCountsForRollover?: boolean;
  onlyRealMoneyCountsForRollover?: boolean;
  minBetsRequired?: number;
  allowDepositsAfterActivation?: boolean;
}

// Función para calcular el riesgo por euro en exchange según la cuota mínima
// Basado en ratings del 92.5% (pérdida 7.5%) con cuotas reales del mercado
// Ejemplo: para rollover 2000€ a cuota mín 2.5 → riesgo exchange ~3160€
function calculateExchangeRiskPerEuro(minOdds: number): number {
  // Cuotas muy bajas: 1.5 vs 1.61 → ~0.58€ riesgo por €1 apostado
  if (minOdds <= 1.5) return 0.58;

  // Cuotas bajas: 1.6 vs 1.715 → ~0.67€ riesgo por €1 apostado
  if (minOdds <= 1.6) return 0.67;

  // Cuotas medias-bajas: 2.0 vs 2.14 → ~1.08€ riesgo por €1 apostado
  if (minOdds <= 2.0) return 1.08;

  // Cuotas medias: 2.5 vs 2.67 → ~1.58€ riesgo por €1 apostado
  if (minOdds <= 2.5) return 1.58;

  // Cuotas altas: incremento progresivo
  if (minOdds <= 3.0) return 2.0;

  // Cuotas muy altas: riesgo muy elevado
  return 2.5;
}

export function useRolloverProfitabilityCalculation(
  params: RolloverCalculationParams
): ProfitabilityAnalysis | null {
  return useMemo(() => {
    const {
      bonusValue,
      multiplier,
      maxConversionMultiplier,
      minOdds,
      maxStake,
      depositRequired = 0,
      expectedLossPercentage = 5, // % de pérdida real por diferencia de cuotas
      onlyBonusMoneyCountsForRollover = false,
      onlyRealMoneyCountsForRollover = false,
      minBetsRequired = 1,
      allowDepositsAfterActivation = true,
    } = params;

    // Validar que tenemos las condiciones mínimas requeridas
    if (!minOdds || !maxConversionMultiplier || !multiplier) {
      return null;
    }

    // Validaciones básicas
    if (!bonusValue || bonusValue <= 0 || !multiplier || multiplier <= 0) {
      return null;
    }

    // Configuración inválida
    if (onlyBonusMoneyCountsForRollover && onlyRealMoneyCountsForRollover) {
      return {
        expectedValue: 0,
        totalRolloverRequired: 0,
        estimatedLoss: 0,
        requiredBankroll: 0,
        recommendedBets: 0,
        recommendedBetSizes: [],
        recommendedStrategy: "AVOID",
        firstBetAmount: undefined,
        
        // Configuración original
        bonusValue,
        depositRequired,
        maxConversionMultiplier,
        minOdds,
        maxStake,
        minBetsRequired,
        onlyBonusMoneyCountsForRollover,
        onlyRealMoneyCountsForRollover,
        allowDepositsAfterActivation,
        expectedLossPercentage,
        
        restrictions: {
          conversionBlocksUnderlay: false,
          minOddsTooHigh: false,
          hasStakeLimit: false,
          tooManyBetsRequired: false,
          mustUseRealMoneyOnly: false,
        },
        
        metadata: {
          canUseUnderlay: false,
          rolloverMultiplier: multiplier,
          estimatedROI: 0,
          estimatedExchangeCapital: 0,
          exchangeRiskPerEuro: 0,
          totalCapitalNeeded: 0,
        },
      };
    }

    // ============================================
    // 1. CÁLCULO DEL CAPITAL NECESARIO
    // ============================================

    const totalRolloverRequired = bonusValue * multiplier;
    const exchangeRiskPerEuro = calculateExchangeRiskPerEuro(minOdds);

    // Capital base necesario en casa de apuestas
    const baseBankroll = bonusValue + depositRequired;

    // Capital adicional en casa para liberar todo el rollover (worst case)
    const additionalHouseBankroll = onlyBonusMoneyCountsForRollover
      ? 0
      : totalRolloverRequired;

    // Capital necesario en exchange para liberar todo el rollover
    const exchangeCapitalForFullRollover = Math.round(
      totalRolloverRequired * exchangeRiskPerEuro
    );

    const totalCapitalNeeded =
      baseBankroll + additionalHouseBankroll + exchangeCapitalForFullRollover;

    // ============================================
    // 2. DETERMINAR SI SE PUEDE USAR UNDERLAY
    // ============================================

    // Lógica dinámica según tu análisis
    // Si no hay conversión límite, no bloquea underlay
    // Si no hay cuota mínima, no hay restricción de cuota
    const conversionBlocksUnderlay = !!(maxConversionMultiplier && minOdds && maxConversionMultiplier <= minOdds);
    const minOddsTooHigh = !!(maxConversionMultiplier && minOdds && minOdds > (maxConversionMultiplier * 0.8));
    const hasStakeLimit = !!(maxStake && maxStake < (bonusValue + depositRequired));
    const tooManyBetsRequired = minBetsRequired > 1;
    const mustUseRealMoneyOnly = onlyRealMoneyCountsForRollover;

    const canUseUnderlay = !(
      conversionBlocksUnderlay ||
      minOddsTooHigh ||
      hasStakeLimit ||
      tooManyBetsRequired ||
      mustUseRealMoneyOnly
    );

    // ============================================
    // 3A. ESTRATEGIA UNDERLAY
    // ============================================

    if (canUseUnderlay) {
      // Primera apuesta: bono + depósito a cuota entre minOdds y maxConversion
      const firstBetAmount = bonusValue + depositRequired;

      // Para underlay buscamos cuotas entre la mínima permitida y el límite de conversión
      const minUnderlayOdds = minOdds; // Exactamente la cuota mínima requerida
      const maxUnderlayOdds = maxConversionMultiplier * 0.95; // Margen de seguridad del 5% sobre el límite de conversión

      // Escenario si PIERDO la primera apuesta (underlay) → GANANCIA INMEDIATA
      const underlayWinScenario = {
        profit: bonusValue, // Bono liberado inmediatamente
        probability: 1 / ((minUnderlayOdds + maxUnderlayOdds) / 2), // Probabilidad real de perder según las cuotas
      };

      // Escenario si GANO la primera apuesta → DEBO COMPLETAR ROLLOVER
      const remainingRollover = totalRolloverRequired - firstBetAmount;
      const continuationScenario = {
        additionalLoss: remainingRollover * (expectedLossPercentage / 100), // Pérdida real del rollover restante
        additionalExchangeCapital: Math.round(
          remainingRollover * exchangeRiskPerEuro
        ),
        probability: 1 - underlayWinScenario.probability, // Probabilidad de ganar la apuesta
      };

      // El valor esperado SUMA ambos escenarios (ambos son positivos para underlay)
      const expectedValue =
        underlayWinScenario.profit * underlayWinScenario.probability +
        (bonusValue - continuationScenario.additionalLoss) *
          continuationScenario.probability;

      // Capital mínimo para primera apuesta
      const minCapitalFirstBet =
        firstBetAmount + Math.round(firstBetAmount * exchangeRiskPerEuro);

      // Capital adicional si gano (peor escenario)
      // const additionalCapitalIfWin = !allowDepositsAfterActivation ?
      //   remainingRollover + lossScenario.additionalExchangeCapital :
      //   lossScenario.additionalExchangeCapital;

      return {
        expectedValue: Math.round(expectedValue),
        totalRolloverRequired,
        estimatedLoss: Math.round(continuationScenario.additionalLoss),
        requiredBankroll: baseBankroll,
        recommendedBets: 1,
        recommendedBetSizes: [firstBetAmount],
        recommendedStrategy: "UNDERLAY_FIRST",
        firstBetAmount,
        
        // Configuración original
        bonusValue,
        depositRequired,
        maxConversionMultiplier,
        minOdds,
        maxStake,
        minBetsRequired,
        onlyBonusMoneyCountsForRollover,
        onlyRealMoneyCountsForRollover,
        allowDepositsAfterActivation,
        expectedLossPercentage,
        
        restrictions: {
          conversionBlocksUnderlay,
          minOddsTooHigh,
          hasStakeLimit,
          tooManyBetsRequired,
          mustUseRealMoneyOnly,
        },
        
        metadata: {
          canUseUnderlay: true,
          rolloverMultiplier: multiplier,
          estimatedROI: Math.round((expectedValue / minCapitalFirstBet) * 100),
          estimatedExchangeCapital: Math.round(
            firstBetAmount * exchangeRiskPerEuro
          ),
          exchangeRiskPerEuro: Math.round(exchangeRiskPerEuro * 100) / 100,
          totalCapitalNeeded: minCapitalFirstBet,
          exchangeCapitalFirstBet: Math.round(
            firstBetAmount * exchangeRiskPerEuro
          ),
          totalHouseCapitalIfNoDeposits: !allowDepositsAfterActivation
            ? baseBankroll + remainingRollover
            : undefined,
          underlayScenario: {
            successProfit: bonusValue, // Si PIERDO la apuesta (underlay exitoso)
            failureProfit: Math.round(
              bonusValue - continuationScenario.additionalLoss
            ), // Si GANO la apuesta
            additionalBankrollIfFails: !allowDepositsAfterActivation
              ? remainingRollover
              : 0,
            additionalExchangeCapital:
              continuationScenario.additionalExchangeCapital,
            successProbability: underlayWinScenario.probability,
          },
          recommendedOddsRange: {
            min: minUnderlayOdds,
            max: maxUnderlayOdds,
            optimal: (minUnderlayOdds + maxUnderlayOdds) / 2,
          },
        },
      };
    }

    // ============================================
    // 3B. ESTRATEGIA ESTÁNDAR (SOLO DINERO REAL)
    // ============================================

    // Liberamos el bono SIEMPRE con dinero real
    const totalLoss = totalRolloverRequired * (expectedLossPercentage / 100);
    const netProfit = bonusValue - totalLoss;

    // Calcular número de apuestas recomendadas basándose en límites reales
    const maxAllowedStake = maxStake || (bonusValue + depositRequired) * 2; // Si no hay límite, usar 2x del capital base como máximo razonable
    const minSuggestedStake = Math.max(bonusValue * 0.1, 10); // Mínimo 10% del bono o 10€
    
    const recommendedBetSize = Math.min(
      maxAllowedStake,
      Math.max(minSuggestedStake, totalRolloverRequired / Math.max(minBetsRequired, 8))
    );
    const recommendedBets = Math.ceil(
      totalRolloverRequired / recommendedBetSize
    );

    // Verificar rentabilidad basándose en ratios dinámicos
    const minimumProfitThreshold = bonusValue * 0.2; // Mínimo 20% del valor del bono
    const maxCapitalRatio = bonusValue * 10; // Máximo 10x el valor del bono en capital total
    
    const recommendedStrategy =
      netProfit > minimumProfitThreshold && totalCapitalNeeded < maxCapitalRatio
        ? "STANDARD_ONLY"
        : "AVOID";

    return {
      expectedValue: Math.round(netProfit),
      totalRolloverRequired,
      estimatedLoss: Math.round(totalLoss),
      requiredBankroll: baseBankroll,
      recommendedBets,
      recommendedBetSizes: Array(Math.min(3, recommendedBets))
        .fill(0)
        .map((_, i) => Math.round(recommendedBetSize * (1 + i * 0.2))),
      recommendedStrategy,
      firstBetAmount: undefined,
      
      // Configuración original
      bonusValue,
      depositRequired,
      maxConversionMultiplier,
      minOdds,
      maxStake,
      minBetsRequired,
      onlyBonusMoneyCountsForRollover,
      onlyRealMoneyCountsForRollover,
      allowDepositsAfterActivation,
      expectedLossPercentage,
      
      restrictions: {
        conversionBlocksUnderlay,
        minOddsTooHigh,
        hasStakeLimit,
        tooManyBetsRequired,
        mustUseRealMoneyOnly,
      },
      
      metadata: {
        canUseUnderlay: false,
        rolloverMultiplier: multiplier,
        estimatedROI: Math.round((netProfit / totalCapitalNeeded) * 100),
        estimatedExchangeCapital: exchangeCapitalForFullRollover,
        exchangeRiskPerEuro: Math.round(exchangeRiskPerEuro * 100) / 100,
        totalCapitalNeeded,
        standardMethodInfo: {
          mustUseRealMoneyOnly: true,
          mustDepositBeforeActivation: !allowDepositsAfterActivation,
          totalRealMoneyNeeded: totalRolloverRequired,
          rolloverVsBonusRatio: multiplier,
          estimatedNetProfit: Math.round(netProfit),
        },
      },
    };
  }, [params]);
}
