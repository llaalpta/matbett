"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDeposit } from "@/hooks/api/useDeposits";

export default function DepositDetailPage() {
  const params = useParams();
  const depositId = params.id as string;

  const { data: deposit, isLoading, error } = useDeposit(depositId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando depósito...</p>
        </div>
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-500">
              {error ? `Error: ${error.message}` : "Depósito no encontrado"}
            </p>
            <Link href="/deposits">
              <Button>Volver a depósitos</Button>
            </Link>
          </div>
        </div>
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
              Volver a depósitos
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Depósito - €{deposit.amount}</h1>
            <p className="text-muted-foreground">{deposit.bookmaker}</p>
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
            <CardTitle>Información del Depósito</CardTitle>
            <CardDescription>Detalles básicos del depósito</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Cantidad</p>
              <p className="text-muted-foreground text-sm">€{deposit.amount}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Casa de apuestas</p>
              <p className="text-muted-foreground text-sm">
                {deposit.bookmaker}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Fecha de creación</p>
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
            <CardTitle>Contexto de Promoción</CardTitle>
            <CardDescription>
              Información sobre promociones asociadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deposit.promotionContext?.promotionId ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Promoción ID</p>
                  <p className="text-muted-foreground text-sm">
                    {deposit.promotionContext.promotionId}
                  </p>
                </div>
                <div>
                  <Link
                    href={`/promotions/${deposit.promotionContext.promotionId}`}
                  >
                    <Button variant="outline" size="sm">
                      Ver promoción
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No está asociado a ninguna promoción
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
