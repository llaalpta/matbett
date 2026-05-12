"use client";

import { useParams } from "next/navigation";

import { CenteredErrorState } from "@/components/feedback";
import { BetNewPageContent } from "@/components/molecules/bets/BetNewPageContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBetNewFromRewardContext } from "@/hooks/domain/bets/useBetNewFromRewardContext";

export default function NewBetFromRewardPage() {
  const params = useParams<{ rewardId: string }>();
  const rewardId = params.rewardId;
  const { initialContext, isLoading, isError, error, unavailableReason, retry } =
    useBetNewFromRewardContext(rewardId);

  if (isLoading) {
    return <div className="container mx-auto p-6">Cargando contexto de recompensa...</div>;
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="No se pudo cargar el contexto de la recompensa."
          onRetry={retry}
          backHref={`/rewards/${rewardId}`}
          backLabel="Volver a la recompensa"
        />
      </div>
    );
  }

  if (!initialContext) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>No se puede precargar esta recompensa</CardTitle>
            <CardDescription>
              {unavailableReason ??
                "El contexto de esta recompensa no está disponible para registrar apuestas."}
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    );
  }

  return (
    <BetNewPageContent
      initialContext={initialContext}
      backHref={`/rewards/${rewardId}`}
      backLabel="Volver a la recompensa"
    />
  );
}
