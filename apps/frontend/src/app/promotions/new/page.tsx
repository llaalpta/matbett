"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PromotionForm } from "@/components/organisms/PromotionForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { useCreatePromotion } from "@/hooks/api/usePromotions";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import type { PromotionFormData } from "@/types/hooks";

export default function NewPromotionPage() {
  const router = useRouter();
  const createPromotion = useCreatePromotion();
  const {
    data: bookmakerAccountsResponse,
    isLoading: isLoadingAccounts,
    error: bookmakerAccountsError,
  } = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();
  const bookmakerAccounts = bookmakerAccountsResponse?.data ?? [];

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

  if (isLoadingAccounts) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando cuentas...</p>
        </div>
      </div>
    );
  }

  if (bookmakerAccountsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          No se pudieron cargar las cuentas necesarias para registrar promociones.
        </div>
      </div>
    );
  }

  if (bookmakerAccounts.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Necesitas una cuenta</CardTitle>
            <CardDescription>
              Las promociones deben quedar asociadas a una cuenta real del usuario.
              Crea una cuenta antes de continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href="/bookmaker-accounts/new">
              <Button>Crear cuenta</Button>
            </Link>
            <Link href="/bookmaker-accounts">
              <Button variant="outline">Ver cuentas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
