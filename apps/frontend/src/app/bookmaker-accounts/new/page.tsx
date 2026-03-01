"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BookmakerAccountForm } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { useCreateBookmakerAccount } from "@/hooks/api/useBookmakerAccounts";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import type { BookmakerAccountFormData } from "@/types/hooks";

export default function NewBookmakerAccountPage() {
  const router = useRouter();
  const createBookmakerAccount = useCreateBookmakerAccount();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();

  const handleSubmit = async (data: BookmakerAccountFormData) => {
    clearApiError();

    try {
      await createBookmakerAccount.mutateAsync(data);
      notifySuccess("Cuenta creada.");
      router.push("/bookmaker-accounts");
    } catch (error) {
      setApiError(error, "No se pudo crear la cuenta.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/bookmaker-accounts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a cuentas
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nueva cuenta</h1>
          <p className="text-muted-foreground">
            Registra una casa de apuestas o exchange para reutilizarla en el resto del flujo.
          </p>
        </div>
      </div>

      <div className="max-w-3xl rounded-lg border p-6">
        <BookmakerAccountForm
          onSubmit={handleSubmit}
          isLoading={createBookmakerAccount.isPending}
          apiErrorMessage={apiErrorMessage}
          onDismissApiError={clearApiError}
          submitLabel="Crear cuenta"
        />
      </div>
    </div>
  );
}
