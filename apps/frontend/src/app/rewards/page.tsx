"use client";

import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RewardsPage() {
  // TODO: Implementar hook useRewards cuando esté disponible
  const rewards: unknown[] = [];
  const isLoading = false;
  const error = null as Error | null;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando recompensas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-red-500">
            Error al cargar recompensas: {error?.message || "Error desconocido"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recompensas</h1>
          <p className="text-muted-foreground">
            Gestiona todas tus recompensas
          </p>
        </div>
        {/* Las recompensas normalmente se crean a través de promociones */}
        <Button disabled className="opacity-50">
          <Plus className="mr-2 h-4 w-4" />
          Se crean con promociones
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((rewardData) => {
          const reward = rewardData as Record<string, unknown>;
          return (
            <Card
              key={reward.id as string}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span>{reward.type as string}</span>
                  <span className="text-muted-foreground text-sm font-normal">
                    €{reward.value as number}
                  </span>
                </CardTitle>
                <CardDescription>
                  Estado: {reward.status as string}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <p className="text-muted-foreground text-sm">
                    Promoción: {reward.promotionId as string}
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Link href={`/rewards/${reward.id as string}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/rewards/${reward.id as string}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {rewards.length === 0 && (
          <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">
              No tienes recompensas disponibles
            </p>
            <Link href="/promotions/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear promoción con recompensas
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
