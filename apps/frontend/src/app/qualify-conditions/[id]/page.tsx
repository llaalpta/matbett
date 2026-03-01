"use client";

import { getLabel, rewardTypeOptions } from "@matbett/shared";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { CenteredErrorState } from "@/components/feedback";
import { BetEntryLauncherCard } from "@/components/molecules/bets/BetEntryLauncherCard";
import { QualifyConditionStandaloneForm } from "@/components/organisms/QualifyConditionStandaloneForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePromotion } from "@/hooks/api/usePromotions";
import {
  useQualifyCondition,
  useUpdateQualifyCondition,
} from "@/hooks/api/useQualifyConditions";
import { useQualifyConditionAccessLogic } from "@/hooks/domain/qualifyConditions/useQualifyConditionAccessLogic";
import type { RewardQualifyConditionFormData } from "@/types/hooks";

export default function QualifyConditionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qualifyConditionId = params.id;
  const {
    data: qualifyCondition,
    isLoading,
    isError,
    error,
    refetch,
  } = useQualifyCondition(qualifyConditionId);
  const { data: promotionData } = usePromotion(qualifyCondition?.promotionId);
  const updateMutation = useUpdateQualifyCondition();
  const qualifyConditionAccess = useQualifyConditionAccessLogic({
    isPersisted: Boolean(qualifyCondition?.id),
    conditionId: qualifyCondition?.id,
    conditionType: qualifyCondition?.type,
    conditionStatus: qualifyCondition?.status,
    promotion: promotionData,
  });
  const linkedRewards =
    promotionData?.phases.flatMap((phase) =>
      phase.rewards
        .filter((reward) =>
          reward.qualifyConditions.some(
            (rewardCondition) => rewardCondition.id === qualifyConditionId
          )
        )
        .map((reward) => ({
          id: reward.id,
          type: reward.type,
          status: reward.status,
          phaseName: phase.name,
        }))
    ) ?? [];

  const handleSubmit = async (data: RewardQualifyConditionFormData) => {
    await updateMutation.mutateAsync({
      id: qualifyConditionId,
      data,
    });
    router.refresh();
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Cargando condicion...</div>;
  }

  if (isError || !qualifyCondition) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="No se pudo cargar la condicion."
          onRetry={() => {
            void refetch();
          }}
          backHref="/qualify-conditions"
          backLabel="Volver"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/qualify-conditions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Editar Qualify Condition</h1>
      </div>

      {qualifyConditionAccess.canLaunchBetEntry ? (
        <BetEntryLauncherCard
          title="Registro contextual de apuestas"
          description="Puedes abrir el formulario de bets con esta qualify condition ya preseleccionada. Al guardar la apuesta se recalcularán los datos de tracking, pero los estados siguen siendo manuales."
          actionLabel="Registrar apuesta para esta condición"
          href={`/bets/new/from-qualify-condition/${qualifyConditionId}`}
          disabledReason={qualifyConditionAccess.betEntryDisabledReason}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Rewards asociadas</CardTitle>
          <CardDescription>
            Esta qualify condition puede quedar congelada por el estado de cualquiera
            de las rewards que la reutilizan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {linkedRewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No se encontraron rewards asociadas dentro de la promoción actual.
            </p>
          ) : (
            <div className="space-y-2">
              {linkedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {getLabel(rewardTypeOptions, reward.type)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fase: {reward.phaseName} · Estado: {reward.status}
                    </p>
                  </div>
                  <Link href={`/rewards/${reward.id}`}>
                    <Button variant="outline" size="sm">
                      Ver reward
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div>
            <Link href="/rewards">
              <Button variant="ghost" size="sm">
                Ir al listado de rewards
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <QualifyConditionStandaloneForm
        promotionId={qualifyCondition.promotionId}
        promotionData={promotionData ?? undefined}
        initialData={qualifyCondition}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
