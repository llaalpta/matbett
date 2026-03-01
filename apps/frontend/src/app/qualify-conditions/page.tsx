"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

import { CenteredErrorState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQualifyConditions } from "@/hooks/api/useQualifyConditions";

export default function QualifyConditionsPage() {
  const { data, isLoading, isError, error, refetch } = useQualifyConditions({
    pageIndex: 0,
    pageSize: 50,
  });
  const qualifyConditions = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando condiciones de calificacion...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="No se pudieron cargar las condiciones de calificacion."
          onRetry={() => {
            void refetch();
          }}
          backHref="/promotions"
          backLabel="Volver a promociones"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Condiciones de calificacion</h1>
          <p className="text-muted-foreground">
            Gestiona las condiciones de calificacion persistidas.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {qualifyConditions.map((condition) => (
          <Card key={condition.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{condition.type}</span>
                <span className="text-muted-foreground text-sm font-normal">
                  {condition.status}
                </span>
              </CardTitle>
              <CardDescription>
                {condition.description?.trim() || "Sin descripcion"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <p className="text-muted-foreground text-sm">
                  Promocion: {condition.promotionId}
                </p>
              </div>
              <div className="flex justify-end">
                <Link href={`/qualify-conditions/${condition.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {qualifyConditions.length === 0 ? (
          <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">
              No hay condiciones de calificacion disponibles.
            </p>
            <Link href="/promotions">
              <Button>Ir a promociones</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
