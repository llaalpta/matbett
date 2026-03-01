"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { BetEntryLauncherCard } from "@/components/molecules/bets/BetEntryLauncherCard";
import { RewardStandaloneForm } from "@/components/organisms/RewardStandaloneForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePromotion } from "@/hooks/api/usePromotions";
import { useReward } from "@/hooks/api/useRewards";
import { useRewardAccessLogic } from "@/hooks/domain/rewards/useRewardAccessLogic";

export default function RewardDetailPage() {
  const params = useParams<{ id: string }>();
  const rewardId = params.id;
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

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/rewards">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Editar Reward</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contexto de la reward</CardTitle>
          <CardDescription>
            Esta reward pertenece a una promoción y a una fase concretas. Ese
            contexto determina qué se puede editar y cuándo puede registrarse su
            tracking de uso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Promoción</p>
              <p className="text-sm text-muted-foreground">
                {promotion?.name ?? "No disponible"}
              </p>
              <p className="text-sm text-muted-foreground">
                Estado: {promotion?.status ?? "No disponible"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Fase</p>
              <p className="text-sm text-muted-foreground">
                {phase?.name ?? "No disponible"}
              </p>
              <p className="text-sm text-muted-foreground">
                Estado: {phase?.status ?? "No disponible"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Cuenta asociada</p>
              <p className="text-sm text-muted-foreground">
                {promotion?.bookmaker ?? "No disponible"}
              </p>
              <p className="text-sm text-muted-foreground">
                {promotion?.bookmakerAccountIdentifier ??
                  "Sin identificador visible"}
              </p>
            </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Navegación</p>
            <div className="flex flex-wrap gap-2">
                {promotion?.id ? (
                  <Link href={`/promotions/${promotion.id}`}>
                    <Button variant="outline" size="sm">
                      Ver promoción
                    </Button>
                </Link>
              ) : null}
                {reward?.id && rewardAccess.isStructureEditable ? (
                  <Link href={`/qualify-conditions/new/from-reward/${reward.id}`}>
                    <Button variant="outline" size="sm">
                      Añadir qualify condition
                    </Button>
                  </Link>
                ) : reward?.id ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title={rewardAccess.structureLockedReason}
                  >
                    Añadir qualify condition
                  </Button>
                ) : null}
                {reward?.promotionId ? (
                  <Link href="/rewards">
                    <Button variant="ghost" size="sm">
                      Ir al listado de rewards
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {rewardAccess.canLaunchBetEntry ? (
        <BetEntryLauncherCard
          title="Registro contextual de apuestas"
          description="Abre el formulario de bets para intentar usar esta reward con un contexto precargado."
          actionLabel="Usar esta reward"
          href={`/bets/new/from-reward/${rewardId}`}
          disabledReason={rewardAccess.betEntryDisabledReason}
        />
      ) : null}
      <RewardStandaloneForm rewardId={rewardId} />
    </div>
  );
}
