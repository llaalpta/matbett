"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { CenteredErrorState } from "@/components/feedback";
import { QualifyConditionRelatedRewardsTable } from "@/components/molecules/qualifyConditions/QualifyConditionRelatedRewardsTable";
import { QualifyConditionTrackingSection } from "@/components/molecules/qualifyConditions/QualifyConditionTrackingSection";
import { QualifyConditionStandaloneForm } from "@/components/organisms/QualifyConditionStandaloneForm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
  const handleSubmit = async (data: RewardQualifyConditionFormData) => {
    await updateMutation.mutateAsync({
      id: qualifyConditionId,
      data,
    });
    router.refresh();
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Cargando condición...</div>;
  }

  if (isError || !qualifyCondition) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="No se pudo cargar la condición."
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
      <PageHeader
        eyebrow="Condiciones de calificación"
        title="Editar condición de calificación"
        description="Edita la definición y el estado de la condición. El tracking se registra de forma manual desde acciones contextuales."
        actions={
          <>
            <Link href="/qualify-conditions">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a condiciones
              </Button>
            </Link>
            {promotionData?.id ? (
              <Link href={`/promotions/${promotionData.id}`}>
                <Button variant="ghost" size="sm">
                  Ver promoción
                </Button>
              </Link>
            ) : null}
          </>
        }
      />

      <QualifyConditionRelatedRewardsTable
        rewards={qualifyCondition.linkedRewards}
      />

      <QualifyConditionStandaloneForm
        promotionId={qualifyCondition.promotionId}
        promotionData={promotionData ?? undefined}
        initialData={qualifyCondition}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />

      <QualifyConditionTrackingSection
        condition={qualifyCondition}
        canLaunchBetEntry={qualifyConditionAccess.canLaunchBetEntry}
        betEntryHref={`/bets/new/from-qualify-condition/${qualifyConditionId}`}
      />
    </div>
  );
}
