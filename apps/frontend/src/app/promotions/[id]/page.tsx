"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { CenteredErrorState } from "@/components/feedback";
import { PromotionForm } from "@/components/organisms/PromotionForm";
import { Button } from "@/components/ui/button";
import {
  useDeletePromotion,
  usePromotion,
  useUpdatePromotion,
} from "@/hooks/api/usePromotions";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import type { PromotionFormData } from "@/types/hooks";

export default function PromotionEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const promotionId = params.id;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const query = usePromotion(promotionId);
  const { data: promotion, isLoading, error, refetch } = query;
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();
  const firstPhase = promotion?.phases[0];

  const handleSubmit = async (data: PromotionFormData) => {
    clearApiError();
    try {
      await updatePromotion.mutateAsync({ id: promotionId, data });
      notifySuccess("Promocion actualizada.");
    } catch (error) {
      setApiError(error, "No se pudo actualizar la promocion.");
    }
  };

  const handleDeletePromotion = async () => {
    clearApiError();
    try {
      await deletePromotion.mutateAsync({ id: promotionId });
      notifySuccess("Promocion eliminada.");
      router.push("/promotions");
    } catch (error) {
      setApiError(error, "No se pudo eliminar la promocion.");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando promocion...</p>
        </div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="Promocion no encontrada."
          onRetry={() => {
            void refetch();
          }}
          backHref="/promotions"
          backLabel="Volver a promociones"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Actualizar promocion</h1>
          <p className="mt-1 text-muted-foreground">
            {promotion.name}
            {promotion.description ? ` - ${promotion.description}` : ""}
          </p>
        </div>
        <Link href="/promotions">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {firstPhase ? (
          <Link
            href={`/rewards/new/from-phase/${firstPhase.id}?promotionId=${promotionId}`}
          >
            <Button type="button" variant="outline">
              Añadir reward
            </Button>
          </Link>
        ) : null}
        <Button
          type="button"
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={deletePromotion.isPending}
        >
          Eliminar promocion
        </Button>
      </div>

      <PromotionForm
        initialData={promotion}
        apiErrorMessage={apiErrorMessage}
        onDismissApiError={clearApiError}
        onSubmit={handleSubmit}
        isLoading={updatePromotion.isPending}
        promotionId={promotionId}
        showBackButton
        backToLabel="Volver a Promociones"
        backHref="/promotions"
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Eliminar promocion"
        description="Esta accion eliminara la promocion y todos sus datos asociados."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          void handleDeletePromotion();
        }}
      />
    </div>
  );
}
