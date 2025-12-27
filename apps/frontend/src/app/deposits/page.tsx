"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTRPC } from "@/lib/trpc";

function DepositList() {
  const trpc = useTRPC();
  // Usar queryOptions generado por el proxy tRPC
  // Sin argumentos porque el router no requiere input obligatorio (userId va en ctx)
  const { data, isLoading } = useQuery(
    trpc.deposit.list.queryOptions({
      pageIndex: 0,
      pageSize: 20,
    })
  );

  const deposits = data?.data;

  if (isLoading) {
    return <div>Cargando depósitos...</div>;
  }

  if (!deposits || deposits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="mt-2 text-lg font-semibold text-gray-900">
          No hay depósitos
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Comienza registrando tu primer depósito.
        </p>
        <div className="mt-6">
          <Link href="/deposits/new">
            <Button>
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nuevo Depósito
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {deposits.map((deposit) => (
        <Card key={deposit.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">
                {deposit.bookmaker}
              </CardTitle>
              <span className="text-2xl font-bold text-green-600">
                €{deposit.amount}
              </span>
            </div>
            <CardDescription>
              {deposit.promotionContext?.promotionId ? (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  Promoción: {deposit.promotionContext.promotionId}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                  Independiente
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Fecha:</span>
                <span>{new Date(deposit.createdAt).toLocaleDateString()}</span>
              </div>
              {deposit.code && (
                <div className="flex justify-between mt-1">
                  <span>Código:</span>
                  <span className="font-mono">{deposit.code}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Link href={`/deposits/${deposit.id}`}>
                <Button variant="outline" size="sm">
                  Ver
                </Button>
              </Link>
              <Link href={`/deposits/${deposit.id}/edit`}>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DepositsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Depósitos</h1>
          <p className="text-muted-foreground">
            Gestiona tus ingresos en las casas de apuestas.
          </p>
        </div>
        <Link href="/deposits/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" /> Nuevo Depósito
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando vista...</div>}>
        <DepositList />
      </Suspense>
    </div>
  );
}