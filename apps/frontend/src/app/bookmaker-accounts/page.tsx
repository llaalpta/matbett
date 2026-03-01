"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { ApiErrorBanner, CenteredErrorState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useBookmakerAccounts,
  useDeleteBookmakerAccount,
} from "@/hooks/api/useBookmakerAccounts";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import {
  formatBookmakerAccountLabel,
  getBookmakerAccountTypeLabel,
} from "@/utils/bookmakerAccounts";
import { formatCurrencyAmount } from "@/utils/formatters";

export default function BookmakerAccountsPage() {
  const { data, isLoading, error, refetch } = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });
  const deleteBookmakerAccount = useDeleteBookmakerAccount();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();
  const accounts = data?.data ?? [];

  const handleDelete = async (id: string, accountLabel: string) => {
    const confirmed = window.confirm(
      `Se eliminará la cuenta ${accountLabel}. ¿Continuar?`
    );
    if (!confirmed) {
      return;
    }

    clearApiError();

    try {
      await deleteBookmakerAccount.mutateAsync({ id });
      notifySuccess("Cuenta eliminada.");
    } catch (deleteError) {
      setApiError(deleteError, "No se pudo eliminar la cuenta.");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando cuentas de bookmaker...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="No se pudieron cargar las cuentas de bookmaker."
          onRetry={() => {
            void refetch();
          }}
          backHref="/"
          backLabel="Volver al inicio"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cuentas</h1>
          <p className="text-muted-foreground">
            Gestiona las cuentas reales que usarás en promociones, depósitos y apuestas.
          </p>
        </div>
        <Link href="/bookmaker-accounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva cuenta
          </Button>
        </Link>
      </div>

      <ApiErrorBanner
        errorMessage={apiErrorMessage}
        onDismissError={clearApiError}
      />

      {accounts.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">No hay cuentas registradas</h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Crea al menos una cuenta para poder alimentar el resto de formularios
            con tus operadores reales.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/bookmaker-accounts/new">
              <Button>Registrar primera cuenta</Button>
            </Link>
            <Link href="/bets/new">
              <Button variant="outline">Ir a apuestas</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const accountLabel = formatBookmakerAccountLabel(account);
            const accountTypeLabel = getBookmakerAccountTypeLabel(
              account.accountType
            );

            return (
              <Card key={account.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-3">
                    <span>{account.bookmaker}</span>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                      {accountTypeLabel}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {account.accountIdentifier}
                    {" · "}
                    Actualizada{" "}
                    {new Date(account.updatedAt).toLocaleDateString("es-ES")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Saldo real</span>
                      <span>{formatCurrencyAmount(account.realBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Saldo bono</span>
                      <span>{formatCurrencyAmount(account.bonusBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Saldo freebet</span>
                      <span>{formatCurrencyAmount(account.freebetBalance)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Link href={`/bookmaker-accounts/${account.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(account.id, accountLabel)}
                      disabled={deleteBookmakerAccount.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
