"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DepositForm } from "@/components/molecules/DepositForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { useDeposits } from "@/hooks/api/useDeposits";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import type { DepositFormData } from "@/types/hooks";

export default function NewDepositPage() {
  const router = useRouter();
  const { createDeposit, isCreating } = useDeposits();
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
  const defaultBookmakerAccountId = bookmakerAccounts[0]?.id ?? "";

  const handleSubmit = async (data: DepositFormData) => {
    clearApiError();
    try {
      await createDeposit({
        bookmakerAccountId: data.bookmakerAccountId,
        amount: data.amount,
        date: data.date,
        code: data.code,
      });
      notifySuccess("Deposito registrado.");
      router.push("/deposits");
    } catch (error) {
      setApiError(error, "No se pudo registrar el deposito.");
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
          No se pudieron cargar las cuentas necesarias para registrar depósitos.
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
              El registro de depósitos utiliza cuentas reales del usuario. Crea una
              cuenta antes de continuar.
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
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/deposits">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a depositos
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo deposito</h1>
          <p className="text-muted-foreground">
            Registra un nuevo deposito en tu casa de apuestas.
          </p>
        </div>
      </div>

        <div className="max-w-2xl">
          <div className="rounded-lg border p-6">
            <DepositForm
              initialData={{ bookmakerAccountId: defaultBookmakerAccountId }}
              onSubmit={handleSubmit}
              isLoading={isCreating}
              apiErrorMessage={apiErrorMessage}
            onDismissApiError={clearApiError}
          />
        </div>
      </div>
    </div>
  );
}
