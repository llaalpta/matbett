import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProfitabilityAnalysis } from "@/types/calculators";

interface RolloverAnalysisPanelProps {
  analysis: ProfitabilityAnalysis;
}

export function RolloverAnalysisPanel({
  analysis,
}: RolloverAnalysisPanelProps) {
  const {
    expectedValue,
    totalRolloverRequired,
    requiredBankroll,
    recommendedStrategy,
    firstBetAmount,
    metadata,
    restrictions,
    maxConversionMultiplier,
    minOdds,
    maxStake,
    minBetsRequired,
    allowDepositsAfterActivation,
  } = analysis;

  // Generar warnings basándose en los datos
  const generateWarnings = (): string[] => {
    const warnings: string[] = [];

    if (!allowDepositsAfterActivation) {
      warnings.push(
        "⚠️ Debes tener todo el capital disponible ANTES de activar el bono"
      );
    }

    if (expectedValue <= 20) {
      warnings.push(
        `❌ POCO RENTABLE: Beneficio ${expectedValue}€ vs riesgo ${metadata?.totalCapitalNeeded}€`
      );
    }

    if (
      restrictions.conversionBlocksUnderlay &&
      restrictions.mustUseRealMoneyOnly
    ) {
      warnings.push(
        "🚨 CONFIGURACIÓN INVÁLIDA: No puede ser que solo cuente dinero de bono Y solo dinero real simultáneamente"
      );
    }

    return warnings;
  };

  // Generar restricciones que impiden underlay
  const generateRestrictions = (): string[] => {
    const restrictionsList: string[] = [];

    if (restrictions.conversionBlocksUnderlay) {
      restrictionsList.push(
        `Conversión ${maxConversionMultiplier}x ≤ cuota mínima ${minOdds}`
      );
    }
    if (restrictions.minOddsTooHigh) {
      restrictionsList.push(`Cuota mínima ${minOdds} demasiado alta`);
    }
    if (restrictions.hasStakeLimit) {
      restrictionsList.push(`Stake limitado a ${maxStake}€`);
    }
    if (restrictions.tooManyBetsRequired) {
      restrictionsList.push(`Mínimo ${minBetsRequired} apuestas requeridas`);
    }
    if (restrictions.mustUseRealMoneyOnly) {
      restrictionsList.push("Solo dinero real cuenta para rollover");
    }

    return restrictionsList.length > 0
      ? restrictionsList
      : ["Restricciones de rollover"];
  };

  const warnings = generateWarnings();
  const restrictionsList = generateRestrictions();

  // Configuración de estrategias simplificada
  const strategyConfig = {
    UNDERLAY_FIRST: {
      color: "bg-green-100 text-green-800 border-green-300",
      label: "✅ Método Underlay Recomendado",
      icon: "💚",
    },
    STANDARD_ONLY: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      label: "⚠️ Solo Método Estándar",
      icon: "⚠️",
    },
    AVOID: {
      color: "bg-red-100 text-red-800 border-red-300",
      label: "❌ No Recomendado",
      icon: "🚫",
    },
  };

  const config = strategyConfig[recommendedStrategy];

  return (
    <div className="space-y-6">
      {/* Header simplificado */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={config.color}>
          {config.label}
        </Badge>
        <div className="text-2xl font-bold">
          <span
            className={
              expectedValue > 50
                ? "text-green-600"
                : expectedValue > 20
                  ? "text-yellow-600"
                  : "text-red-600"
            }
          >
            +{expectedValue}€
          </span>
        </div>
      </div>

      {/* Información básica */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">
              Rollover Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalRolloverRequired}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">
              ROI Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold ${
                (metadata?.estimatedROI ?? 0) > 15
                  ? "text-green-600"
                  : (metadata?.estimatedROI ?? 0) > 5
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {metadata?.estimatedROI ?? 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">
              Capital Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{requiredBankroll}€</div>
            <div className="text-muted-foreground text-xs">
              Casa de apuestas
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Estrategia específica */}
      {metadata?.canUseUnderlay ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-700">
            📈 Estrategia Underlay
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-700">
                  Primera Apuesta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {firstBetAmount}€
                </div>
                <div className="text-muted-foreground mt-1 text-sm">
                  Capital en exchange: +{metadata?.exchangeCapitalFirstBet}€
                </div>
                <div className="text-muted-foreground text-xs">
                  ({metadata?.exchangeRiskPerEuro}€ riesgo por €1 apostado)
                </div>
                {metadata?.recommendedOddsRange && (
                  <div className="mt-2 text-xs text-green-600">
                    Cuotas: {metadata.recommendedOddsRange.min} -{" "}
                    {metadata.recommendedOddsRange.max.toFixed(1)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-yellow-700">
                  Si Ganas (30% prob.)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-yellow-600">
                  Continuar rollover
                </div>
                <div className="text-muted-foreground text-sm">
                  Exchange adicional: +
                  {metadata?.underlayScenario?.additionalExchangeCapital}€
                </div>
                {metadata?.totalHouseCapitalIfNoDeposits && (
                  <div className="mt-1 text-xs text-red-600">
                    ⚠️ Casa: +
                    {metadata.totalHouseCapitalIfNoDeposits - requiredBankroll}€
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Plan:</strong> Apostar {firstBetAmount}€ a cuota entre{" "}
              {metadata?.recommendedOddsRange?.min.toFixed(1)} y{" "}
              {metadata?.recommendedOddsRange?.max.toFixed(1)} (inferior a
              conversión {maxConversionMultiplier}x). Si pierdes → bono liberado
              (+{metadata?.underlayScenario?.successProfit}€). Si ganas →
              continuar con método estándar.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-700">
            📊 Método Estándar Únicamente
          </h3>

          <Card className="border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-yellow-700">
                Capital Total Necesario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {metadata?.totalCapitalNeeded}€
              </div>
              <div className="text-muted-foreground mt-1 text-sm">
                Casa: {requiredBankroll}€ + Exchange:{" "}
                {metadata?.estimatedExchangeCapital}€
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                Riesgo exchange: {metadata?.exchangeRiskPerEuro}€ por cada €1
                apostado
              </div>
              <div className="mt-2 text-xs text-yellow-600">
                Beneficio neto:{" "}
                {metadata?.standardMethodInfo?.estimatedNetProfit}€
              </div>
            </CardContent>
          </Card>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              <strong>Restricciones:</strong> {restrictionsList.join(", ")}
            </AlertDescription>
          </Alert>

          {!allowDepositsAfterActivation && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                <strong>⚠️ Importante:</strong> Necesitas{" "}
                {metadata?.totalCapitalNeeded}€ disponibles antes de activar
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Advertencias importantes */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <Alert key={index} className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
