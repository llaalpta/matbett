"use client";

import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
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

type RewardListItem = {
  id: string;
  type: string;
  value: number;
  status: string;
  promotionId: string;
};

export default function RewardsPage() {
  // TODO: Implement useRewards hook when available.
  const rewards: RewardListItem[] = [];
  const isLoading = false;
  const error: unknown = null;

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
        <CenteredErrorState
          error={error}
          fallbackMessage="No se pudieron cargar las recompensas."
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
          <h1 className="text-3xl font-bold">Recompensas</h1>
          <p className="text-muted-foreground">Gestiona todas tus recompensas</p>
        </div>
        <Button disabled className="opacity-50">
          <Plus className="mr-2 h-4 w-4" />
          Se crean con promociones
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{reward.type}</span>
                <span className="text-muted-foreground text-sm font-normal">
                  EUR {reward.value}
                </span>
              </CardTitle>
              <CardDescription>Estado: {reward.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <p className="text-muted-foreground text-sm">
                  Promocion: {reward.promotionId}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Link href={`/rewards/${reward.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/rewards/${reward.id}/edit`}>
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
        ))}

        {rewards.length === 0 ? (
          <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">
              No tienes recompensas disponibles.
            </p>
            <Link href="/promotions/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear promocion con recompensas
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
