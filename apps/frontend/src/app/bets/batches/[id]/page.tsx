"use client";

import { useParams } from "next/navigation";

import { CenteredErrorState } from "@/components/feedback";
import { BetBatchDetailPageContent } from "@/components/molecules/bets/BetBatchDetailPageContent";
import { useBetBatch } from "@/hooks/api/useBets";

export default function BetBatchDetailPage() {
  const params = useParams();
  const paramId = params.id;
  const batchId =
    typeof paramId === "string"
      ? paramId
      : Array.isArray(paramId)
        ? (paramId[0] ?? "")
        : "";

  const { data: batch, isLoading, error } = useBetBatch(batchId);

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
          backHref="/bets/batches"
          backLabel="Volver a batches"
        />
      </div>
    );
  }

  return <BetBatchDetailPageContent batch={batch} />;
}
