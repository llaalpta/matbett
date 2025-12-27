"use client";

import { ArrowLeft } from "lucide-react";
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

export default function RewardDetailPage() {
  const params = useParams();
  const rewardId = params.id as string;

  // TODO: Implementar useReward hook cuando esté disponible
  const reward = null;
  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando recompensa...</p>
        </div>
      </div>
    );
  }

  if (error || !reward) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-500">
              Recompensa no encontrada o hook pendiente de implementación
            </p>
            <Link href="/rewards">
              <Button>Volver a recompensas</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/rewards">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a recompensas
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Recompensa #{rewardId}</h1>
          <p className="text-muted-foreground">Detalles de la recompensa</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Información pendiente</CardTitle>
            <CardDescription>
              Esta página se completará cuando el hook useReward esté
              implementado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Las recompensas normalmente se editan desde la promoción que las
              contiene.
            </p>
            <p className="text-muted-foreground mt-2">
              Campos a mostrar: type, value, status, qualify conditions, usage
              conditions, etc.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
