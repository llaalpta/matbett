"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PromotionForm } from "@/components/organisms/PromotionForm";
import { Button } from "@/components/ui/button";
import { useCreatePromotion } from "@/hooks/api/usePromotions";
import type { PromotionFormData } from "@/types/hooks";

export default function NewPromotionPage() {
  const router = useRouter();
  const createPromotion = useCreatePromotion();

  const handleSubmit = async (data: PromotionFormData) => {
    try {
      await createPromotion.mutateAsync(data);
      router.push("/promotions");
    } catch (error) {
      console.error("Error creating promotion:", error);
      // TODO: Agregar manejo de errores con toast/notification
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold">Nueva Promoción</h1>
        <p className="text-muted-foreground mt-1">
          Crea una nueva promoción con todas sus recompensas y condiciones
        </p>
      </div>

      <PromotionForm
        onSubmit={handleSubmit}
        isLoading={createPromotion.isPending}
        showBackButton={true}
        backToLabel="Volver a Promociones"
        backHref="/promotions"
      />
    </div>
  );
}
