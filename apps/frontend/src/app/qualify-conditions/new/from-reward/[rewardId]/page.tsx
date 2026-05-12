"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { QualifyConditionStandaloneForm } from "@/components/organisms/QualifyConditionStandaloneForm";
import { Button } from "@/components/ui/button";
import {
  DetailGrid,
  DetailRow,
} from "@/components/ui/detail-grid";
import { PageHeader } from "@/components/ui/page-header";
import { usePromotion } from "@/hooks/api/usePromotions";
import { useCreateQualifyConditionForReward } from "@/hooks/api/useQualifyConditions";
import { useReward } from "@/hooks/api/useRewards";
import type { RewardQualifyConditionFormData } from "@/types/hooks";

export default function QualifyConditionCreateFromRewardPage() {
  const params = useParams<{ rewardId: string }>();
  const router = useRouter();
  const rewardId = params.rewardId;
  const { data: reward, isLoading: isLoadingReward } = useReward(rewardId);
  const { data: promotion, isLoading: isLoadingPromotion } = usePromotion(
    reward?.promotionId
  );
  const createMutation = useCreateQualifyConditionForReward();
  const phase = promotion?.phases.find((item) => item.id === reward?.phaseId);

  const handleSubmit = async (data: RewardQualifyConditionFormData) => {
    const created = await createMutation.mutateAsync({
      rewardId,
      data,
    });
    router.push(`/qualify-conditions/${created.id}`);
  };

  const isLoading = isLoadingReward || isLoadingPromotion;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <PageHeader
        eyebrow="Condiciones de calificación"
        title="Nueva condición de calificación"
        description="Crea una condición dentro del contexto de una recompensa existente."
        actions={
          <Link href={`/rewards/${rewardId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a recompensa
            </Button>
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Contexto</h2>
        <DetailGrid className="rounded-md border bg-card p-4">
          <DetailRow
            label="Promoción"
            value={isLoading ? "Cargando..." : promotion?.name ?? "No disponible"}
          />
          <DetailRow
            label="Fase"
            value={isLoading ? "Cargando..." : phase?.name ?? "No disponible"}
          />
          <DetailRow
            label="Recompensa"
            value={isLoading ? "Cargando..." : reward?.type ?? "No disponible"}
          />
        </DetailGrid>
      </section>

      <QualifyConditionStandaloneForm
        promotionId={reward?.promotionId}
        promotionData={promotion ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Crear condición"
        successMessage="Condición de calificación creada."
        errorMessage="No se pudo crear la condición de calificación."
      />
    </div>
  );
}
