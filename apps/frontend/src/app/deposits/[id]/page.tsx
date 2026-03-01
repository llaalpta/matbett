"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { CenteredErrorState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDeposit } from "@/hooks/api/useDeposits";
import { formatBookmakerAccountLabel, getBookmakerAccountTypeLabel } from "@/utils/bookmakerAccounts";

export default function DepositDetailPage() {
  const params = useParams<{ id: string }>();
  const depositId = params.id;
  const { data: deposit, isLoading, error, refetch } = useDeposit(depositId);
  const qualifyParticipation = deposit?.participations.find(
    (participation) => participation.role === "QUALIFY_TRACKING"
  );
  const accountLabel = deposit ? formatBookmakerAccountLabel(deposit) : "";
  const accountTypeLabel = deposit
    ? getBookmakerAccountTypeLabel(deposit.bookmakerAccountType)
    : "";

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando deposito...</p>
        </div>
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="Deposito no encontrado."
          onRetry={() => {
            void refetch();
          }}
          backHref="/deposits"
          backLabel="Volver a depositos"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/deposits">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a depositos
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Deposito - EUR {deposit.amount}</h1>
            <p className="text-muted-foreground">{accountLabel}</p>
          </div>
        </div>
        <Link href={`/deposits/${depositId}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacion del deposito</CardTitle>
            <CardDescription>Detalles basicos del deposito</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Cantidad</p>
              <p className="text-muted-foreground text-sm">EUR {deposit.amount}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Cuenta</p>
              <p className="text-muted-foreground text-sm">{accountLabel}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Tipo</p>
              <p className="text-muted-foreground text-sm">{accountTypeLabel}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Fecha de creacion</p>
              <p className="text-muted-foreground text-sm">
                {new Date(deposit.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">ID</p>
              <p className="text-muted-foreground font-mono text-sm">
                {deposit.id}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contexto de promocion</CardTitle>
            <CardDescription>Tracking asociado a qualify conditions</CardDescription>
          </CardHeader>
          <CardContent>
            {qualifyParticipation ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Qualify Condition ID</p>
                  <p className="text-muted-foreground text-sm">
                    {qualifyParticipation.qualifyConditionId}
                  </p>
                </div>
                {qualifyParticipation.promotionId ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Promocion ID</p>
                    <p className="text-muted-foreground text-sm">
                      {qualifyParticipation.promotionId}
                    </p>
                    <Link href={`/promotions/${qualifyParticipation.promotionId}`}>
                      <Button variant="outline" size="sm">
                        Ver promocion
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No esta asociado a ninguna promocion.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
