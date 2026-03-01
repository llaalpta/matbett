"use client";

import { useRouter } from "next/navigation";

import { PromotionForm } from "@/components/organisms/PromotionForm";
import { useCreatePromotion } from "@/hooks/api/usePromotions";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import type { PromotionFormData } from "@/types/hooks";

export default function NewPromotionPage() {
  const router = useRouter();
  const createPromotion = useCreatePromotion();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();

  const handleSubmit = async (data: PromotionFormData) => {
    clearApiError();
    try {
      await createPromotion.mutateAsync(data);
      notifySuccess("Promocion creada.");
      router.push("/promotions");
    } catch (error) {
      setApiError(error, "No se pudo crear la promocion.");
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Registrar Promocion</h1>
        <p className="mt-1 text-muted-foreground">
          Crea una nueva promocion con todas sus recompensas y condiciones.
        </p>
      </div>

      <PromotionForm
        apiErrorMessage={apiErrorMessage}
        onDismissApiError={clearApiError}
        onSubmit={handleSubmit}
        isLoading={createPromotion.isPending}
        showBackButton
        backToLabel="Volver a Promociones"
        backHref="/promotions"
      />
    </div>
  );
}
