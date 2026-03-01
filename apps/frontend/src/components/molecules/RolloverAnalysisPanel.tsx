import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProfitabilityAnalysis } from "@/types/calculators";
import { formatCurrency, formatPercentage } from "@/utils/formatters";

interface RolloverAnalysisPanelProps {
  analysis: ProfitabilityAnalysis;
}

const strategyConfig = {
  UNDERLAY_FIRST: {
    color: "bg-green-100 text-green-800 border-green-300",
    label: "Underlay viable",
  },
  STANDARD_ONLY: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: "Unica via tecnica",
  },
  AVOID: {
    color: "bg-red-100 text-red-800 border-red-300",
    label: "No rentable",
  },
} as const;

export function RolloverAnalysisPanel({
  analysis,
}: RolloverAnalysisPanelProps) {
  const {
    expectedValue,
    totalRolloverRequired,
    recommendedStrategy,
    firstBetAmount,
    metadata,
    restrictions,
    maxConversionMultiplier,
    maxConvertibleAmount,
    minOdds,
    maxStake,
    minBetsRequired,
    allowDepositsAfterActivation,
  } = analysis;

  const restrictionsList: string[] = [];
  if (restrictions.conversionBlocksUnderlay) {
    restrictionsList.push(
      `Conversión ${maxConversionMultiplier ?? "N/A"}x no supera cuota mínima ${minOdds ?? "N/A"}`
    );
  }
  if (restrictions.invalidOddsRange) {
    restrictionsList.push("Rango de cuotas inválido");
  }
  if (restrictions.stakeLimitBlocksInitialUnderlay) {
    restrictionsList.push(`Stake máximo (${maxStake}) bloquea underlay inicial`);
  }
  if (restrictions.stakeLimitsBlockPlan) {
    restrictionsList.push("Límites de stake inconsistentes");
  }
  if (restrictions.tooManyBetsRequired) {
    restrictionsList.push(`Mínimo ${minBetsRequired} apuestas requeridas`);
  }
  if (restrictions.mustUseRealMoneyOnly) {
    restrictionsList.push("Cumplimiento con dinero real");
  }
  if (restrictions.bonusCannotBeUsedForBetting) {
    restrictionsList.push("El bono no puede usarse para apostar");
  }
  if (restrictions.requiresSpecificOutcome) {
    restrictionsList.push("Sólo cuentan apuestas con resultado específico");
  }
  if (restrictions.returnedBetsDoNotCount) {
    restrictionsList.push("Las apuestas devueltas no cuentan para rollover");
  }
  if (restrictions.cashoutBetsDoNotCount) {
    restrictionsList.push("Las apuestas con cashout no cuentan para rollover");
  }
  if (restrictions.mustSettleWithinTimeframe) {
    restrictionsList.push("Sólo cuentan apuestas liquidadas dentro del plazo");
  }
  if (restrictions.onlySettledBetsCount) {
    restrictionsList.push("Sólo cuentan apuestas liquidadas");
  }
  if (restrictions.hasMaxConvertibleAmount) {
    restrictionsList.push(
      `Máximo convertible a saldo real: ${formatCurrency(maxConvertibleAmount ?? 0)}`
    );
  }
  if (restrictions.hasOtherRestrictions) {
    restrictionsList.push("Hay otras restricciones relevantes");
  }

  const warnings: string[] = [];
  if (!allowDepositsAfterActivation) {
    warnings.push("Debes tener el capital total antes de activar el bono.");
  }
  if (restrictions.withdrawalsNotAllowed) {
    warnings.push("No se permiten retiradas durante el rollover.");
  }
  if (restrictions.withdrawalCancelsBonus) {
    warnings.push("Retirar durante el rollover puede cancelar el bono.");
  }
  if (restrictions.requiresSpecificOutcome) {
    warnings.push(
      "La condición de resultado requerido aumenta la dificultad real; valida ejecución con calculadora detallada."
    );
  }

  const config = strategyConfig[recommendedStrategy];
  const isInvalidConfig =
    restrictions.invalidOddsRange || restrictions.stakeLimitsBlockPlan;
  const analysisStatus = isInvalidConfig
    ? "invalido"
    : expectedValue > 0
      ? "valido_rentable"
      : "valido_no_rentable";
  const statusLabel =
    analysisStatus === "invalido"
      ? "Estado: Invalido"
      : analysisStatus === "valido_rentable"
        ? "Estado: Valido y rentable"
        : "Estado: Valido, no rentable";

  return (
    <div className="space-y-6">
      {!metadata.keySignals.lowRiskMatchedBettingPossible && (
        <Alert className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">
            No hay via de matched betting sin riesgo con la configuracion actual
            (resultado requerido distinto de ANY). Recomendacion: no entrar.
          </AlertDescription>
        </Alert>
      )}

      {metadata.keySignals.avoidBonusFundsForRollover && (
        <Alert className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">
            NO SE PUEDE USAR SALDO DEL BONO PARA LIBERAR EL BONO. Ejecuta el
            rollover sólo con saldo real para mantener matched betting sin
            riesgo.
          </AlertDescription>
        </Alert>
      )}

      {metadata.keySignals.fullBookmakerBankrollRequiredUpfront && (
        <Alert className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">
            No se permiten depósitos posteriores, necesitas disponer del saldo
            completo para liberar el rollover en el bookmaker antes de activar.
          </AlertDescription>
        </Alert>
      )}

      {metadata.requiredRealMoneyUpfront !== undefined && (
        <Alert className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">
            Debes tener al menos {formatCurrency(metadata.requiredRealMoneyUpfront)}
            {" "}de dinero real en la casa antes de activar el bono.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
          <Badge variant="secondary">{statusLabel}</Badge>
        </div>
        <div
          className={`text-2xl font-bold ${
            expectedValue > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {expectedValue > 0 ? "+" : ""}
          {formatCurrency(expectedValue)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">
              Capital en bookmaker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">
                Calificar bono (deposito/stake):{" "}
                <span className="font-semibold">
                  {formatCurrency(analysis.depositRequired)}
                </span>
              </div>
              <div className="text-sm">
                Adicional para rollover:{" "}
                <span className="font-semibold">
                  {formatCurrency(
                    Math.max(0, metadata.bookmakerCapitalMax - analysis.depositRequired)
                  )}
                </span>
              </div>
              <div className="text-sm">
                Total bookmaker:{" "}
                <span className="text-xl font-bold">
                  {formatCurrency(metadata.bookmakerCapitalMax)}
                </span>
              </div>
            </div>
            <div className="text-muted-foreground text-xs">
              {metadata.keySignals.fullBookmakerBankrollRequiredUpfront
                ? "Necesario por adelantado antes de activar."
                : "Puedes completarlo con ingresos posteriores."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">
              Rollover total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatCurrency(totalRolloverRequired)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">
              Capital exchange
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metadata.canUseUnderlay ? (
              <div className="space-y-1">
                <div className="text-sm">
                  Min:{" "}
                  <span className="text-xl font-bold">
                    {formatCurrency(metadata.exchangeCapitalMin)}
                  </span>
                </div>
                <div className="text-sm">
                  Max:{" "}
                  <span className="text-xl font-bold">
                    {formatCurrency(metadata.exchangeCapitalMax)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xl font-bold">
                {formatCurrency(metadata.exchangeCapitalMax)}
              </div>
            )}
            <div className="text-muted-foreground text-xs">
              Riesgo por 1 EUR: {metadata.exchangeRiskPerEuro}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">
              ROI estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatPercentage(metadata.estimatedROI, "es-ES", 0)}
            </div>
            <div className="text-muted-foreground text-xs">
              EV {expectedValue > 0 ? "+" : ""}
              {formatCurrency(expectedValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {metadata.canUseUnderlay ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-700">
            Arbol de decisión (underlay viable)
          </h3>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              Escenario inicial: cruce underlay por {formatCurrency(firstBetAmount ?? 0)}
              {" "}(bono + depósito), respetando el rango de cuota permitido.
            </AlertDescription>
          </Alert>
          <Alert>
            <AlertDescription>
              Rama A: si pierde en bookmaker, finaliza el flujo. Rama B: si gana
              en bookmaker, continuar por método estándar hasta completar
              rollover.
            </AlertDescription>
          </Alert>
          {(metadata.continuationPlans?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm">
                  Si gana la primera apuesta (continuación estándar)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(metadata.continuationPlans ?? []).map((plan) => (
                  <div
                    key={`${plan.label}-${plan.bets}`}
                    className="border-border/50 rounded-md border p-3 text-sm"
                  >
                    <span className="font-medium">{plan.label}: </span>
                    {plan.bets} apuestas x {formatCurrency(plan.stakePerBet)} (total{" "}
                    {formatCurrency(plan.totalRollover)})
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {(metadata.continuationPlans?.length ?? 0) === 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                No se pudo construir un plan de continuación dentro de los
                límites de stake/mínimo de apuestas configurados.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-700">Plan estándar</h3>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              Capital previsto para liberar todo el rollover:{" "}
              {formatCurrency(metadata.totalCapitalNeeded)} (book + exchange).
            </AlertDescription>
          </Alert>
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              Ejecución por método estándar según restricciones de liquidez y
              límites configurados.
            </AlertDescription>
          </Alert>
          {metadata.releaseMode === "STANDARD_REAL_MONEY" &&
            restrictions.mustUseRealMoneyOnly && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  Este escenario se trata como liberación con dinero real para
                  evitar degradación por límite de conversión del bono.
                </AlertDescription>
              </Alert>
            )}
          {metadata.releaseMode !== "NO_LOW_RISK_PATH" && (
            <Alert className="border-slate-200 bg-slate-50">
              <AlertDescription className="text-slate-700">
                Nota: que exista vía técnica no implica que convenga ejecutarla.
                Si el EV es negativo, la recomendación operativa es no entrar.
              </AlertDescription>
            </Alert>
          )}
          {(metadata.standardPlans?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm">
                  Opciones de ejecución del rollover
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(metadata.standardPlans ?? []).map((plan) => (
                  <div
                    key={`${plan.label}-${plan.bets}`}
                    className="border-border/50 rounded-md border p-3 text-sm"
                  >
                    <span className="font-medium">{plan.label}: </span>
                    {plan.bets} apuestas x {formatCurrency(plan.stakePerBet)} (total{" "}
                    {formatCurrency(plan.totalRollover)})
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {(metadata.standardPlans?.length ?? 0) === 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                No se pudieron generar planes realistas con los límites de stake
                y apuestas mínimas actuales.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {restrictionsList.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            Restricciones activas: {restrictionsList.join(", ")}.
          </AlertDescription>
        </Alert>
      )}

      {metadata.assumptions && metadata.assumptions.length > 0 && (
        <Alert className="border-slate-200 bg-slate-50">
          <AlertDescription className="text-slate-700">
            Supuestos aplicados: {metadata.assumptions.join(" ")}
          </AlertDescription>
        </Alert>
      )}
      {warnings.map((warning) => (
        <Alert key={warning} className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{warning}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
