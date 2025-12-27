"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PromotionForm } from "@/components/organisms/PromotionForm";
import { Button } from "@/components/ui/button";
import { usePromotion, useUpdatePromotion } from "@/hooks/api/usePromotions";
import type { PromotionFormData } from "@/types/hooks";

export default function PromotionEditPage() {
  const params = useParams();
  const promotionId = params.id as string;

  const query = usePromotion(promotionId);
  const { data: promotion, isLoading, error } = query;
  const updatePromotion = useUpdatePromotion();

  const handleSubmit = async (data: PromotionFormData) => {
    try {
      await updatePromotion.mutateAsync({ id: promotionId, data });
      // Opcional: mostrar notificación de éxito
      console.warn("Promoción actualizada exitosamente");
    } catch (error) {
      console.error("Error updating promotion:", error);
      // TODO: Agregar manejo de errores con toast/notification
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando promoción...</p>
        </div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-500">
              {error ? `Error: ${error.message}` : "Promoción no encontrada"}
            </p>
            <Link href="/promotions">
              <Button>Volver a promociones</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold">Editar Promoción</h1>
        <p className="text-muted-foreground mt-1">
          {promotion.name}{promotion.description ? ` - ${promotion.description}` : ''}
        </p>
      </div>

      <PromotionForm
        initialData={promotion}
        onSubmit={handleSubmit}
        isLoading={updatePromotion.isPending}
        promotionId={promotionId}
        showBackButton={true}
        backToLabel="Volver a Promociones"
        backHref="/promotions"
      />
    </div>
  );
}
