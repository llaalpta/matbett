"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { RewardCreateForm } from "@/components/organisms/RewardStandaloneForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DetailGrid, DetailRow } from "@/components/ui/detail-grid";
import { PageHeader } from "@/components/ui/page-header";
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
            <CardTitle>No se puede crear la recompensa</CardTitle>
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
      <PageHeader
        eyebrow="Recompensas"
        title="Nueva recompensa"
        description="Crea la recompensa dentro de una fase existente. Las condiciones de calificación se añaden después desde el detalle de la recompensa."
        actions={
          <Link href={`/promotions/${promotionId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a promoción
            </Button>
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Contexto</h2>
        <DetailGrid className="rounded-md border bg-card p-4">
          <DetailRow
            label="Promoción"
            value={promotion?.name ?? "Cargando promoción..."}
          />
          <DetailRow label="Fase" value={phase?.name ?? phaseId} />
        </DetailGrid>
      </section>

      <RewardCreateForm promotionId={promotionId} phaseId={phaseId} />
    </div>
  );
}
