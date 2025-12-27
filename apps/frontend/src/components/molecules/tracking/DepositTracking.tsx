"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepositQualifyConditionServerModel } from "@/types/hooks";

/**
 * DepositTracking - Componente READ-ONLY para mostrar tracking de depósitos
 *
 * IMPORTANTE: Este componente NO edita datos, solo los muestra.
 * El tracking es calculado por el backend y se pasa como prop desde serverData.
 */
interface DepositTrackingProps {
  conditionServerData?: DepositQualifyConditionServerModel;
}

export function DepositTracking({ conditionServerData }: DepositTrackingProps) {
  // Early return if no data
  if (!conditionServerData) {
    return (
      <Card className="border-muted-foreground/30 border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No hay datos de tracking disponibles.
        </CardContent>
      </Card>
    );
  }

  // Extract with proper type assertion since DepositQualifyConditionServerModel is already narrowed
  const tracking = conditionServerData.tracking ?? null;
  const conditions = conditionServerData.conditions;

  if (!tracking && !conditions) {
    return (
      <Card className="border-muted-foreground/30 border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No hay datos de tracking disponibles. Los datos se mostrarán cuando el usuario
          complete la condición.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-900">
            Seguimiento de Depósito
          </CardTitle>
          {tracking?.depositAmount && (
            <Badge variant="outline" className="bg-blue-100">
              Completado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Requirements (from conditions) */}
        {conditions && (
          <div className="bg-muted/30 grid grid-cols-2 gap-4 rounded-md p-3 text-xs">
            {conditions.contributesToRewardValue ? (
              // CALCULATED VALUE - show min/max/bonus
              <>
                <div>
                  <span className="text-muted-foreground block font-semibold">
                    Monto Mínimo Requerido:
                  </span>
                  <span className="font-mono">{conditions.minAmount} €</span>
                </div>
                {conditions.maxAmount && (
                  <div>
                    <span className="text-muted-foreground block font-semibold">
                      Monto Máximo:
                    </span>
                    <span className="font-mono">{conditions.maxAmount} €</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block font-semibold">
                    Bonus Porcentaje:
                  </span>
                  <span className="font-mono">{conditions.bonusPercentage}%</span>
                </div>
              </>
            ) : (
              // FIXED VALUE - show target amount
              <div>
                <span className="text-muted-foreground block font-semibold">
                  Monto Requerido:
                </span>
                <span className="font-mono">{conditions.targetAmount} €</span>
              </div>
            )}
            {conditions.depositCode && (
              <div>
                <span className="text-muted-foreground block font-semibold">
                  Código Requerido:
                </span>
                <span className="font-mono">{conditions.depositCode}</span>
              </div>
            )}
          </div>
        )}

        {/* Tracking Data (actual deposit made by user) */}
        {tracking ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-blue-900">Depósito Realizado:</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">ID de Depósito</div>
                <div className="font-mono text-sm">
                  {tracking.qualifyingDepositId || "N/A"}
                </div>
              </div>
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Monto Depositado</div>
                <div className="font-mono text-sm font-semibold">
                  {tracking.depositAmount ? `${tracking.depositAmount} €` : "N/A"}
                </div>
              </div>
            </div>

            {tracking.depositCode && (
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Código Usado</div>
                <div className="font-mono text-sm">{tracking.depositCode}</div>
              </div>
            )}

            {tracking.depositedAt && (
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Fecha de Depósito</div>
                <div className="font-mono text-sm">
                  {new Date(tracking.depositedAt).toLocaleString("es-ES")}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Esperando depósito del usuario...
          </div>
        )}
      </CardContent>
    </Card>
  );
}