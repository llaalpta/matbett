"use client";

import {
  RegisterBetsBatchSchema,
  type RegisterBetsBatch,
  type UpdateBetsBatch,
} from "@matbett/shared";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CenteredErrorState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateBetBatch } from "@/hooks/api/useBets";
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import type { BetBatchInitialContext } from "@/hooks/useBetBatchForm";

import { BetBatchForm } from "./BetBatchForm";

type BetNewPageContentProps = {
  initialContext?: BetBatchInitialContext;
  backHref?: string;
  backLabel?: string;
};

function toRegisterPayload(data: UpdateBetsBatch): RegisterBetsBatch {
  return RegisterBetsBatchSchema.parse({
    strategy: data.strategy,
    calculation: {
      scenarioId: data.calculation.scenarioId,
      target: data.calculation.target?.participationKey
        ? {
            participationKey: data.calculation.target.participationKey,
          }
        : undefined,
    },
    events: data.events,
    profit: data.profit,
    risk: data.risk,
    yield: data.yield,
    legs: data.legs.map(({ betId: _betId, ...leg }) => leg),
  });
}

export function BetNewPageContent({
  initialContext,
  backHref = "/bets",
  backLabel = "Volver a apuestas",
}: BetNewPageContentProps) {
  const router = useRouter();
  const {
    data: bookmakerAccountsResponse,
    isLoading: isBookmakerAccountsLoading,
    error: bookmakerAccountsError,
    refetch: refetchBookmakerAccounts,
  } = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 1,
  });
  const createBetBatch = useCreateBetBatch();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();
  const hasBookmakerAccounts =
    (bookmakerAccountsResponse?.data.length ?? 0) > 0;

  const handleSubmit = async (data: UpdateBetsBatch) => {
    clearApiError();
    try {
      const result = await createBetBatch.mutateAsync(toRegisterPayload(data));
      notifySuccess("Batch de apuestas registrado.");
      router.push(`/bets/${result.id}`);
    } catch (error) {
      setApiError(error, "No se pudo registrar el batch.");
    }
  };

  if (isBookmakerAccountsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando cuentas de bookmaker...</p>
        </div>
      </div>
    );
  }

  if (bookmakerAccountsError) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={bookmakerAccountsError}
          fallbackMessage="No se pudieron cargar las cuentas de bookmaker."
          onRetry={() => {
            void refetchBookmakerAccounts();
          }}
          backHref={backHref}
          backLabel={backLabel}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo batch de apuestas</h1>
          <p className="text-muted-foreground">
            Registro batch + legs + participations alineado con el contrato de shared.
          </p>
        </div>
      </div>

      {!hasBookmakerAccounts ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Necesitas una cuenta de bookmaker</CardTitle>
            <CardDescription>
              El registro de apuestas usa cuentas reales de bookmaker. Crea al
              menos una antes de registrar tu primer batch.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/bookmaker-accounts/new">
              <Button>Crear cuenta</Button>
            </Link>
            <Link href="/bookmaker-accounts">
              <Button variant="outline">Ver cuentas</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <BetBatchForm
          mode="create"
          initialContext={initialContext}
          onSubmit={handleSubmit}
          isLoading={createBetBatch.isPending}
          apiErrorMessage={apiErrorMessage}
          onDismissApiError={clearApiError}
        />
      )}
    </div>
  );
}
