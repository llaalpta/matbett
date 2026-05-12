"use client";

import {
  getLabel,
  qualifyConditionTypeOptions,
  rewardTypeOptions,
} from "@matbett/shared";
import { CheckCircle2, Gift, Link2, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAvailableBetPromotionContexts } from "@/hooks/api/useBets";
import { useBetPromotionContextAssignment } from "@/hooks/domain/bets/useBetPromotionContextAssignment";
import { cn } from "@/lib/utils";

type BetLegPromotionContextActionProps = {
  legIndex: number;
  bookmakerAccountId: string | undefined;
};

function formatRewardSummary(
  rewards: Array<{ rewardType: string; phaseName: string }>
) {
  return rewards
    .map(
      (reward) =>
        `${getLabel(rewardTypeOptions, reward.rewardType)} · ${reward.phaseName}`
    )
    .join(", ");
}

export function BetLegPromotionContextAction({
  legIndex,
  bookmakerAccountId,
}: BetLegPromotionContextActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const availableContexts = useAvailableBetPromotionContexts(bookmakerAccountId);
  const qualifyContexts = availableContexts.data?.qualifyTrackingContexts ?? [];
  const rewardUsageContexts = availableContexts.data?.rewardUsageContexts ?? [];
  const {
    strategy,
    currentTarget,
    getSummariesForLeg,
    hasContext,
    getQualifyContextKey,
    getRewardUsageContextKey,
    addQualifyContextToLeg,
    addRewardUsageContextToLeg,
    removeContext,
    markSummaryAsCalculationTarget,
  } = useBetPromotionContextAssignment({
    qualifyContexts,
    rewardUsageContexts,
  });
  const isDisabled = !bookmakerAccountId;
  const hasAvailableContexts =
    qualifyContexts.length > 0 || rewardUsageContexts.length > 0;
  const linkedContexts = getSummariesForLeg(legIndex);
  const hasLinkedContexts = linkedContexts.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "relative h-7 w-7 p-0",
            hasLinkedContexts &&
              "bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
          )}
          disabled={isDisabled}
          title={
            isDisabled
              ? "Selecciona una cuenta para ver contextos disponibles"
              : "Añadir o gestionar contextos promocionales para esta apuesta"
          }
        >
          <Link2 className="h-3.5 w-3.5" />
          {hasLinkedContexts ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-700 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
              {linkedContexts.length}
            </span>
          ) : null}
          <span className="sr-only">Contexto promocional</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-3">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold">Contexto promocional</div>
            <p className="text-muted-foreground text-xs">
              Contextos vinculados a esta apuesta.
            </p>
          </div>

          {hasLinkedContexts ? (
            <div className="space-y-2">
              {linkedContexts.map((summary) => {
                const isCalculationTarget =
                  currentTarget === summary.targetParticipationKey;

                return (
                  <div
                    key={summary.key}
                    className="rounded-md border bg-muted/20 p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold">
                          {summary.label}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-[11px]">
                          {summary.description}
                        </div>
                      </div>
                      {isCalculationTarget ? (
                        <Badge className="bg-sky-700 text-white">
                          <Target className="h-3 w-3" />
                          Cálculo
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1">
                      {strategy.kind === "HEDGE" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={isCalculationTarget}
                          onClick={() => markSummaryAsCalculationTarget(summary)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Usar por cálculo
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600"
                        onClick={() => removeContext(summary)}
                        title="Eliminar contexto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Eliminar contexto</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
              Sin contexto promocional.
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="w-full">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Vincular contexto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>Vincular contexto promocional</DialogTitle>
                <DialogDescription>
                  Elige una condición de calificación o un uso de recompensa compatible
                  con la cuenta de esta apuesta.
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[560px] overflow-auto rounded-md border">
                <table className="w-full min-w-[780px] text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-[0.04em] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Contexto</th>
                      <th className="px-3 py-2 text-left">Promoción</th>
                      <th className="px-3 py-2 text-left">Recompensa</th>
                      <th className="px-3 py-2 text-left">Detalle</th>
                      <th className="px-3 py-2 text-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {qualifyContexts.map((context) => {
                      const contextKey = getQualifyContextKey(context);
                      const isAlreadyLinked = hasContext(contextKey);

                      return (
                        <tr key={context.qualifyConditionId} className="border-t">
                          <td className="px-3 py-2">
                            <Badge variant="outline">Condición de calificación</Badge>
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {context.promotionName}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {formatRewardSummary(context.rewards)}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            <div className="font-medium text-foreground">
                              {getLabel(
                                qualifyConditionTypeOptions,
                                context.qualifyConditionType
                              )}
                            </div>
                            <div>
                              {context.description || "Sin descripción registrada"}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isAlreadyLinked}
                              onClick={() => {
                                addQualifyContextToLeg(legIndex, context);
                                setIsDialogOpen(false);
                              }}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              {isAlreadyLinked ? "Vinculado" : "Vincular"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}

                    {rewardUsageContexts.map((context) => {
                      const contextKey = getRewardUsageContextKey(context);
                      const isAlreadyLinked = hasContext(contextKey);

                      return (
                        <tr key={context.usageTrackingId} className="border-t">
                          <td className="px-3 py-2">
                            <Badge variant="outline">Uso de recompensa</Badge>
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {context.promotionName}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Gift className="h-3.5 w-3.5" />
                              {getLabel(rewardTypeOptions, context.rewardType)} ·{" "}
                              {context.rewardValue}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {context.phaseName}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isAlreadyLinked}
                              onClick={() => {
                                addRewardUsageContextToLeg(legIndex, context);
                                setIsDialogOpen(false);
                              }}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              {isAlreadyLinked ? "Vinculado" : "Vincular"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}

                    {!hasAvailableContexts ? (
                      <tr>
                        <td
                          className="px-3 py-8 text-center text-muted-foreground"
                          colSpan={5}
                        >
                          No hay condiciones ni recompensas disponibles para la cuenta
                          seleccionada en esta apuesta.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PopoverContent>
    </Popover>
  );
}
