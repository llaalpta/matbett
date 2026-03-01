"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { CenteredErrorState } from "@/components/feedback";
import { QualifyConditionStandaloneForm } from "@/components/organisms/QualifyConditionStandaloneForm";
import { Button } from "@/components/ui/button";
import {
  useQualifyCondition,
  useUpdateQualifyCondition,
} from "@/hooks/api/useQualifyConditions";
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
  const updateMutation = useUpdateQualifyCondition();

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

      <QualifyConditionStandaloneForm
        promotionId={qualifyCondition.promotionId}
        initialData={qualifyCondition}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
