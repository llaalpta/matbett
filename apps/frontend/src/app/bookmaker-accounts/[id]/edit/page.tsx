"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { CenteredErrorState } from "@/components/feedback";
import { BookmakerAccountForm } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import {
  useBookmakerAccount,
  useUpdateBookmakerAccount,
} from "@/hooks/api/useBookmakerAccounts";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import type { BookmakerAccountFormData } from "@/types/hooks";
import {
  formatBookmakerAccountLabel,
  getBookmakerAccountTypeLabel,
} from "@/utils/bookmakerAccounts";

export default function EditBookmakerAccountPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accountId = params.id;
  const { data: account, isLoading, error, refetch } =
    useBookmakerAccount(accountId);
  const updateBookmakerAccount = useUpdateBookmakerAccount();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();

  const handleSubmit = async (data: BookmakerAccountFormData) => {
    clearApiError();

    try {
      await updateBookmakerAccount.mutateAsync({
        id: accountId,
        data,
      });
      notifySuccess("Cuenta actualizada.");
      router.push("/bookmaker-accounts");
    } catch (submitError) {
      setApiError(submitError, "No se pudo actualizar la cuenta.");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando cuenta...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="Cuenta no encontrada."
          onRetry={() => {
            void refetch();
          }}
          backHref="/bookmaker-accounts"
          backLabel="Volver a cuentas"
        />
      </div>
    );
  }

  const accountLabel = formatBookmakerAccountLabel(account);
  const accountTypeLabel = getBookmakerAccountTypeLabel(account.accountType);

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
          <h1 className="text-3xl font-bold">Editar cuenta</h1>
          <p className="text-muted-foreground">
            {accountLabel} · {accountTypeLabel}
          </p>
        </div>
      </div>

      <div className="max-w-3xl rounded-lg border p-6">
        <BookmakerAccountForm
          initialData={account}
          onSubmit={handleSubmit}
          isLoading={updateBookmakerAccount.isPending}
          apiErrorMessage={apiErrorMessage}
          onDismissApiError={clearApiError}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
