"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Qualify Conditions
          </p>
          <h1 className="text-2xl font-semibold">
            Nueva qualify condition
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea una condición dentro del contexto de una reward existente.
          </p>
        </div>
        <Link href={`/rewards/${rewardId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a reward
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contexto</CardTitle>
          <CardDescription>
            La condición quedará vinculada a esta reward y al pool de su
            promoción.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="font-medium">Promoción</p>
            <p className="text-muted-foreground">
              {isLoading ? "Cargando..." : promotion?.name ?? "No disponible"}
            </p>
          </div>
          <div>
            <p className="font-medium">Fase</p>
            <p className="text-muted-foreground">
              {isLoading ? "Cargando..." : phase?.name ?? "No disponible"}
            </p>
          </div>
          <div>
            <p className="font-medium">Reward</p>
            <p className="text-muted-foreground">
              {isLoading ? "Cargando..." : reward?.type ?? "No disponible"}
            </p>
          </div>
        </CardContent>
      </Card>

      <QualifyConditionStandaloneForm
        promotionId={reward?.promotionId}
        promotionData={promotion ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Crear condición"
        submittingLabel="Creando..."
        successMessage="Condición de calificación creada."
        errorMessage="No se pudo crear la condición de calificación."
      />
    </div>
  );
}
