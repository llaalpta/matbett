"use client";

import { UpdateBetsBatchSchema, type UpdateBetsBatch } from "@matbett/shared";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { CenteredErrorState } from "@/components/feedback";
import { BetBatchForm } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { useBetBatch, useUpdateBetBatch } from "@/hooks/api/useBets";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";

const persistedParticipationPrefix = "persisted:";

function isPersistedParticipationKey(participationKey: string) {
  return participationKey.startsWith(persistedParticipationPrefix);
}

function extractPersistedParticipationId(participationKey: string) {
  return participationKey.slice(persistedParticipationPrefix.length);
}

function toUpdatePayload(data: UpdateBetsBatch): UpdateBetsBatch {
  return UpdateBetsBatchSchema.parse({
    ...data,
    calculation: {
      scenarioId: data.calculation.scenarioId,
      target: data.calculation.target?.participationKey
        ? isPersistedParticipationKey(data.calculation.target.participationKey)
          ? {
              participationId: extractPersistedParticipationId(
                data.calculation.target.participationKey
              ),
            }
          : {
              participationKey: data.calculation.target.participationKey,
            }
        : undefined,
    },
  });
}

export default function EditBetPage() {
  const params = useParams();
  const router = useRouter();
  const paramId = params.id;
  const batchId =
    typeof paramId === "string"
      ? paramId
      : Array.isArray(paramId)
        ? (paramId[0] ?? "")
        : "";

  const { data: batch, isLoading, error } = useBetBatch(batchId);
  const updateBetBatch = useUpdateBetBatch();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();

  const handleSubmit = async (data: UpdateBetsBatch) => {
    clearApiError();
    try {
      await updateBetBatch.mutateAsync({
        id: batchId,
        data: toUpdatePayload(data),
      });
      notifySuccess("Batch actualizado.");
      router.push(`/bets/batches/${batchId}`);
    } catch (submitError) {
      setApiError(submitError, "No se pudo actualizar el batch.");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando batch...</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="Batch no encontrado."
          backHref="/bets"
          backLabel="Volver a apuestas"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/bets/batches/${batchId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al detalle
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar batch</h1>
          <p className="text-muted-foreground">
            Edición completa del batch con diff backend sobre legs y participaciones.
          </p>
        </div>
      </div>

      <BetBatchForm
        mode="edit"
        initialData={batch}
        onSubmit={handleSubmit}
        isLoading={updateBetBatch.isPending}
        apiErrorMessage={apiErrorMessage}
        onDismissApiError={clearApiError}
      />
    </div>
  );
}
