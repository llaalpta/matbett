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

export default function BetDetailPage() {
  const params = useParams();
  const betId = params.id as string;

  // TODO: Implementar useBet hook cuando esté disponible
  const bet = null;
  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando apuesta...</p>
        </div>
      </div>
    );
  }

  if (error || !bet) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-500">
              Apuesta no encontrada o hook pendiente de implementación
            </p>
            <Link href="/bets">
              <Button>Volver a apuestas</Button>
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
          <Link href="/bets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a apuestas
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Apuesta #{betId}</h1>
            <p className="text-muted-foreground">Detalles de la apuesta</p>
          </div>
        </div>
        <Link href={`/bets/${betId}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Información pendiente</CardTitle>
            <CardDescription>
              Esta página se completará cuando el hook useBet esté implementado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Campos a mostrar: stake, odds, bookmaker, description, status,
              etc.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
