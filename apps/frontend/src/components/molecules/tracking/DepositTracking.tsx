"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepositQualifyConditionServerModel } from "@/types/hooks";
import { formatCurrency, formatDateTime, formatPercentage } from "@/utils/formatters";

/**
 * DepositTracking - Componente READ-ONLY para mostrar tracking de depositos
 *
 * IMPORTANTE: Este componente NO edita datos, solo los muestra.
 * El tracking es calculado por el backend y se pasa como prop desde serverData.
 */
interface DepositTrackingProps {
  conditionServerData?: DepositQualifyConditionServerModel;
}

export function DepositTracking({ conditionServerData }: DepositTrackingProps) {
  if (!conditionServerData) {
    return (
      <Card className="border-muted-foreground/30 border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No hay datos de tracking disponibles.
        </CardContent>
      </Card>
    );
  }

  const tracking = conditionServerData.tracking ?? null;
  const conditions = conditionServerData.conditions;

  if (!tracking && !conditions) {
    return (
      <Card className="border-muted-foreground/30 border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No hay datos de tracking disponibles. Los datos se mostraran cuando el usuario
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
            Seguimiento de Deposito
          </CardTitle>
          {tracking?.depositAmount && (
            <Badge variant="outline" className="bg-blue-100">
              Completado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Esta condición admite un único depósito calificatorio. Si te equivocaste, edita o
          elimina ese deposito para registrar uno nuevo.
        </div>

        {conditions && (
          <div className="bg-muted/30 grid grid-cols-2 gap-4 rounded-md p-3 text-xs">
            {conditions.contributesToRewardValue ? (
              <>
                <div>
                  <span className="text-muted-foreground block font-semibold">
                    Monto Minimo Requerido:
                  </span>
                  <span className="font-mono">
                    {conditions.minAmount !== undefined
                      ? formatCurrency(conditions.minAmount)
                      : "N/A"}
                  </span>
                </div>
                {conditions.maxAmount && (
                  <div>
                    <span className="text-muted-foreground block font-semibold">
                      Monto Maximo:
                    </span>
                    <span className="font-mono">{formatCurrency(conditions.maxAmount)}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block font-semibold">
                    Bonus Porcentaje:
                  </span>
                  <span className="font-mono">
                    {conditions.bonusPercentage !== undefined
                      ? formatPercentage(conditions.bonusPercentage, "es-ES", 0)
                      : "N/A"}
                  </span>
                </div>
              </>
            ) : (
              <div>
                <span className="text-muted-foreground block font-semibold">
                  Monto Requerido:
                </span>
                <span className="font-mono">
                  {conditions.targetAmount !== undefined
                    ? formatCurrency(conditions.targetAmount)
                    : "N/A"}
                </span>
              </div>
            )}
            {conditions.depositCode && (
              <div>
                <span className="text-muted-foreground block font-semibold">
                  Codigo Requerido:
                </span>
                <span className="font-mono">{conditions.depositCode}</span>
              </div>
            )}
          </div>
        )}

        {tracking ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-blue-900">Deposito Realizado:</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">ID de Deposito</div>
                <div className="font-mono text-sm">{tracking.qualifyingDepositId || "N/A"}</div>
              </div>
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Monto Depositado</div>
                <div className="font-mono text-sm font-semibold">
                  {tracking.depositAmount ? formatCurrency(tracking.depositAmount) : "N/A"}
                </div>
              </div>
            </div>

            {tracking.depositCode && (
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Codigo Usado</div>
                <div className="font-mono text-sm">{tracking.depositCode}</div>
              </div>
            )}

            {tracking.depositedAt && (
              <div className="bg-white rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Fecha de Deposito</div>
                <div className="font-mono text-sm">
                  {formatDateTime(tracking.depositedAt)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Esperando deposito del usuario...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
