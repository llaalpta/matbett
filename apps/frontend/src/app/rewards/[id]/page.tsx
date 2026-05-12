"use client";

import {
  getLabel,
  getRewardNextQualifyDeadline,
  phaseStatusOptions,
  promotionStatusOptions,
  resolveTimeframeWindow,
  rewardStatusOptions,
  rewardTypeOptions,
} from "@matbett/shared";
import { ArrowLeft, ChevronDown, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { RewardQualifyConditionsTable } from "@/components/molecules/rewards/RewardQualifyConditionsTable";
import { RewardRelatedActivitySection } from "@/components/molecules/rewards/RewardRelatedActivitySection";
import { RewardUsageSection } from "@/components/molecules/rewards/RewardUsageSection";
import { RewardStandaloneForm } from "@/components/organisms/RewardStandaloneForm";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DetailGrid, DetailRow } from "@/components/ui/detail-grid";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePromotion } from "@/hooks/api/usePromotions";
import { useReward } from "@/hooks/api/useRewards";
import { useRewardAccessLogic } from "@/hooks/domain/rewards/useRewardAccessLogic";
import { formatCurrencyAmount, formatDate } from "@/utils/formatters";
import { getRewardQualifySummary, getRewardUsageSummary } from "@/utils/rewards";
import { getCompactStatusLabel } from "@/utils/statusLabels";

function formatQualifyDeadline(
  reward: NonNullable<ReturnType<typeof useReward>["data"]>,
  promotion: NonNullable<ReturnType<typeof usePromotion>["data"]> | undefined
) {
  const deadline = getRewardNextQualifyDeadline(reward, promotion);

  if (deadline.state === "date" && deadline.date) {
    return formatDate(deadline.date);
  }

  if (deadline.state === "no_qc") {
    return "Sin condiciones";
  }

  if (deadline.state === "closed") {
    return "Cerrada";
  }

  if (deadline.state === "open_ended") {
    return "Sin fecha de fin";
  }

  return "Sin resolver";
}

function formatUsageDeadline(
  reward: NonNullable<ReturnType<typeof useReward>["data"]>,
  promotion: NonNullable<ReturnType<typeof usePromotion>["data"]> | undefined
) {
  const usageWindow = resolveTimeframeWindow(
    reward.usageConditions.timeframe,
    promotion
  );

  if (!usageWindow.resolved) {
    return "Sin resolver";
  }

  return usageWindow.end ? formatDate(usageWindow.end) : "Sin fecha de fin";
}

export default function RewardDetailPage() {
  const params = useParams<{ id: string }>();
  const rewardId = params.id;
  const [isEditingDefinition, setIsEditingDefinition] = useState(false);
  const { data: reward } = useReward(rewardId);
  const { data: promotion } = usePromotion(reward?.promotionId);
  const phase = promotion?.phases.find((item) => item.id === reward?.phaseId);
  const rewardAccess = useRewardAccessLogic({
    isPersisted: Boolean(reward?.id),
    rewardType: reward?.type,
    rewardStatus: reward?.status,
    claimMethod: reward?.claimMethod,
    qualifyConditionStatuses: reward?.qualifyConditions.map(
      (condition) => condition.status
    ),
    promotion,
    phaseId: reward?.phaseId,
  });

  const qualifySummary = reward ? getRewardQualifySummary(reward) : undefined;
  const usageSummary = reward ? getRewardUsageSummary(reward) : undefined;

  return (
    <div className="container mx-auto space-y-5 p-6">
      <PageHeader
        eyebrow="Recompensas"
        title="Detalle de recompensa"
        description="Revisa el contexto, condiciones, uso y actividad antes de editar la definición."
        actions={
          <>
            <Link href="/rewards">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a recompensas
              </Button>
            </Link>
            {promotion?.id ? (
              <Link href={`/promotions/${promotion.id}`}>
                <Button variant="ghost" size="sm">
                  Ver promoción
                </Button>
              </Link>
            ) : null}
          </>
        }
      />

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold">Resumen operativo</h2>
          {reward?.status ? (
            <StatusBadge
              status={reward.status}
              label={getCompactStatusLabel(
                reward.status,
                getLabel(rewardStatusOptions, reward.status)
              )}
              title={getLabel(rewardStatusOptions, reward.status)}
            />
          ) : null}
        </div>

        <DetailGrid className="rounded-md border bg-card p-4">
          <DetailRow
            label="Promoción"
            value={promotion?.name ?? "No disponible"}
          />
          <DetailRow
            label="Fase"
            value={phase?.name ?? reward?.phaseName ?? "No disponible"}
          />
          <DetailRow
            label="Tipo"
            value={
              reward?.type ? getLabel(rewardTypeOptions, reward.type) : "No disponible"
            }
          />
          <DetailRow
            label="Valor"
            value={formatCurrencyAmount(reward?.value ?? 0)}
            valueClassName="tabular-nums"
          />
          <DetailRow
            label="Calificación hasta"
            value={reward ? formatQualifyDeadline(reward, promotion ?? undefined) : "No disponible"}
          />
          <DetailRow
            label="Condiciones"
            value={qualifySummary?.primary ?? "No disponible"}
          />
          <DetailRow
            label="Uso hasta"
            value={reward ? formatUsageDeadline(reward, promotion ?? undefined) : "No disponible"}
          />
          <DetailRow
            label="Uso"
            value={usageSummary?.primary ?? "No disponible"}
          />
          <DetailRow
            label="Balance"
            value={formatCurrencyAmount(reward?.totalBalance ?? 0)}
            valueClassName="tabular-nums"
          />
          <DetailRow
            label="Casa"
            value={promotion?.bookmaker ?? "No disponible"}
          />
          <DetailRow
            label="Cuenta"
            value={
              promotion?.bookmakerAccountIdentifier ?? "Sin identificador visible"
            }
          />
          <DetailRow
            label="Estado promoción"
            value={
              promotion?.status ? (
                <StatusBadge
                  status={promotion.status}
                  label={getCompactStatusLabel(
                    promotion.status,
                    getLabel(promotionStatusOptions, promotion.status)
                  )}
                  title={getLabel(promotionStatusOptions, promotion.status)}
                />
              ) : (
                "No disponible"
              )
            }
          />
          <DetailRow
            label="Estado fase"
            value={
              phase?.status ? (
                <StatusBadge
                  status={phase.status}
                  label={getCompactStatusLabel(
                    phase.status,
                    getLabel(phaseStatusOptions, phase.status)
                  )}
                  title={getLabel(phaseStatusOptions, phase.status)}
                />
              ) : (
                "No disponible"
              )
            }
          />
        </DetailGrid>
      </section>

      {reward ? (
        <RewardQualifyConditionsTable
          reward={reward}
          canAdd={rewardAccess.isStructureEditable}
          disabledReason={rewardAccess.structureLockedReason}
        />
      ) : null}

      {reward ? (
        <RewardUsageSection
          reward={reward}
          canLaunchBetEntry={rewardAccess.canLaunchBetEntry}
          betEntryHref={`/bets/new/from-reward/${rewardId}`}
          betEntryDisabledReason={rewardAccess.betEntryDisabledReason}
        />
      ) : null}

      {reward ? <RewardRelatedActivitySection rewardId={reward.id} /> : null}

      <Collapsible
        open={isEditingDefinition}
        onOpenChange={setIsEditingDefinition}
        className="rounded-md border bg-card"
      >
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Editar definición</h2>
            <p className="text-muted-foreground text-sm">
              Modifica configuración, estado y condiciones de uso cuando las reglas de ciclo lo permitan.
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              {isEditingDefinition ? "Ocultar edición" : "Editar definición"}
              <ChevronDown
                className={[
                  "ml-2 h-4 w-4 transition-transform",
                  isEditingDefinition ? "rotate-180" : "",
                ].join(" ")}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="border-t px-4 py-4">
          <RewardStandaloneForm rewardId={rewardId} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
