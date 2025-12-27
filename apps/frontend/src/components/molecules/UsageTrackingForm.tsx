"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { RewardServerModel } from "@/types/hooks";

/**
 * UsageTrackingForm - Componente READ-ONLY para mostrar tracking de uso de rewards
 *
 * IMPORTANTE: Este componente NO edita datos, solo los muestra.
 * El usageTracking es calculado por el backend y se pasa como prop desde serverData.
 */
interface UsageTrackingFormProps {
  rewardServerData?: RewardServerModel;
}

export function UsageTrackingForm({ rewardServerData }: UsageTrackingFormProps) {
  if (!rewardServerData) {
    return null;
  }

  const usageTracking = rewardServerData.usageTracking;
  const rewardType = rewardServerData.type;

  if (!usageTracking) {
    return (
      <Card className="border-muted-foreground/30 border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No hay datos de uso todavía. Los datos aparecerán cuando el usuario empiece a usar la recompensa.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-indigo-900">
            Seguimiento de Uso de Recompensa
          </CardTitle>
          <Badge variant="outline" className="bg-indigo-100">
            {rewardType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FREEBET tracking */}
        {rewardType === "FREEBET" && usageTracking.type === "FREEBET" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Total Usado</div>
              <div className="font-mono text-lg font-semibold">
                {usageTracking.totalUsed} €
              </div>
            </div>
            <div className="bg-white rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Balance Restante</div>
              <div className="font-mono text-lg font-semibold text-green-600">
                {usageTracking.remainingBalance} €
              </div>
            </div>
          </div>
        )}

        {/* CASHBACK_FREEBET tracking */}
        {rewardType === "CASHBACK_FREEBET" && usageTracking.type === "CASHBACK_FREEBET" && (
          <div className="bg-white rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total Cashback Generado</div>
            <div className="font-mono text-lg font-semibold">
              {usageTracking.totalCashback} €
            </div>
          </div>
        )}

        {/* BET_BONUS_ROLLOVER tracking */}
        {rewardType === "BET_BONUS_ROLLOVER" && usageTracking.type === "BET_BONUS_ROLLOVER" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Total Usado</div>
                <div className="font-mono text-sm font-semibold">
                  {usageTracking.totalUsed} €
                </div>
              </div>
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Progreso Rollover</div>
                <div className="font-mono text-sm font-semibold text-blue-600">
                  {usageTracking.rolloverProgress} €
                </div>
              </div>
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Rollover Restante</div>
                <div className="font-mono text-sm font-semibold text-orange-600">
                  {usageTracking.remainingRollover} €
                </div>
              </div>
            </div>
            {/* Progress bar */}
            {usageTracking.rolloverProgress > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progreso del Rollover</span>
                  <span className="font-semibold">
                    {usageTracking.rolloverProgress} € apostados
                  </span>
                </div>
                <Progress
                  value={Math.min((usageTracking.rolloverProgress / (usageTracking.rolloverProgress + usageTracking.remainingRollover)) * 100, 100)}
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}

        {/* BET_BONUS_NO_ROLLOVER tracking */}
        {rewardType === "BET_BONUS_NO_ROLLOVER" && usageTracking.type === "BET_BONUS_NO_ROLLOVER" && (
          <div className="bg-white rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total Usado</div>
            <div className="font-mono text-lg font-semibold">
              {usageTracking.totalUsed} €
            </div>
          </div>
        )}

        {/* ENHANCED_ODDS tracking */}
        {rewardType === "ENHANCED_ODDS" && usageTracking.type === "ENHANCED_ODDS" && (
          <div className="bg-white rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Cuotas Utilizadas</div>
            <div className="font-mono text-lg font-semibold">
              {usageTracking.oddsUsed ? "Sí" : "No"}
            </div>
          </div>
        )}

        {/* CASINO_SPINS tracking */}
        {rewardType === "CASINO_SPINS" && usageTracking.type === "CASINO_SPINS" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Spins Usados</div>
              <div className="font-mono text-lg font-semibold">
                {usageTracking.spinsUsed}
              </div>
            </div>
            <div className="bg-white rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Spins Restantes</div>
              <div className="font-mono text-lg font-semibold text-green-600">
                {usageTracking.remainingSpins}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}