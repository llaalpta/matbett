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
import { useBetNewFromQualifyConditionContext } from "@/hooks/domain/bets/useBetNewFromQualifyConditionContext";

export default function NewBetFromQualifyConditionPage() {
  const params = useParams<{ qualifyConditionId: string }>();
  const qualifyConditionId = params.qualifyConditionId;
  const { initialContext, isLoading, isError, error, unavailableReason, retry } =
    useBetNewFromQualifyConditionContext(qualifyConditionId);

  if (isLoading) {
    return <div className="container mx-auto p-6">Cargando contexto de qualify condition...</div>;
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="No se pudo cargar el contexto de la qualify condition."
          onRetry={retry}
          backHref={`/qualify-conditions/${qualifyConditionId}`}
          backLabel="Volver a la qualify condition"
        />
      </div>
    );
  }

  if (!initialContext) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>No se puede precargar esta qualify condition</CardTitle>
            <CardDescription>
              {unavailableReason ??
                "El contexto de esta qualify condition no está disponible para registrar apuestas."}
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
      backHref={`/qualify-conditions/${qualifyConditionId}`}
      backLabel="Volver a la qualify condition"
    />
  );
}
