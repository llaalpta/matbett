"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { RewardCreateForm } from "@/components/organisms/RewardStandaloneForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePromotion } from "@/hooks/api/usePromotions";

export default function RewardCreateFromPhasePage() {
  const params = useParams<{ phaseId: string }>();
  const searchParams = useSearchParams();
  const phaseId = params.phaseId;
  const promotionId = searchParams.get("promotionId") ?? undefined;
  const { data: promotion } = usePromotion(promotionId);
  const phase = promotion?.phases.find((item) => item.id === phaseId);

  if (!promotionId) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <Link href="/promotions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a promociones
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>No se puede crear la reward</CardTitle>
            <CardDescription>
              Falta el contexto de promoción. Abre esta acción desde el detalle
              de una promoción o una fase.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Rewards
          </p>
          <h1 className="text-2xl font-semibold">Nueva reward</h1>
          <p className="text-sm text-muted-foreground">
            Crea la reward dentro de una fase existente. Las qualify conditions
            se añaden después desde el detalle de la reward.
          </p>
        </div>
        <Link href={`/promotions/${promotionId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a promoción
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contexto</CardTitle>
          <CardDescription>
            La reward quedará asociada a esta promoción y fase.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">Promoción</p>
            <p className="text-muted-foreground">
              {promotion?.name ?? "Cargando promoción..."}
            </p>
          </div>
          <div>
            <p className="font-medium">Fase</p>
            <p className="text-muted-foreground">
              {phase?.name ?? phaseId}
            </p>
          </div>
        </CardContent>
      </Card>

      <RewardCreateForm promotionId={promotionId} phaseId={phaseId} />
    </div>
  );
}
