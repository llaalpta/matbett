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

function PromotionList() {
  const trpc = useTRPC();
  // Usar queryOptions generado por el proxy tRPC
  const { data, isLoading } = useQuery(
    trpc.promotion.list.queryOptions({
      pageIndex: 0,
      pageSize: 20,
    })
  );

  const promotions = data?.data;

  if (isLoading) {
    return <div>Cargando promociones...</div>;
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="mt-2 text-lg font-semibold text-gray-900">
          No hay promociones
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Comienza creando tu primera promoción de Matched Betting.
        </p>
        <div className="mt-6">
          <Link href="/promotions/new">
            <Button>
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nueva Promoción
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {promotions.map((promotion) => (
        <Card key={promotion.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">
                {promotion.name}
              </CardTitle>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {promotion.status}
              </span>
            </div>
            <CardDescription>{promotion.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 flex justify-end space-x-2">
              <Link href={`/promotions/${promotion.id}`}>
                <Button variant="outline" size="sm">
                  Ver
                </Button>
              </Link>
              <Link href={`/promotions/${promotion.id}`}>
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

export default function PromotionsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promociones</h1>
          <p className="text-muted-foreground">
            Gestiona tus bonos y promociones de Matched Betting.
          </p>
        </div>
        <Link href="/promotions/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" /> Nueva Promoción
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando vista...</div>}>
        <PromotionList />
      </Suspense>
    </div>
  );
}