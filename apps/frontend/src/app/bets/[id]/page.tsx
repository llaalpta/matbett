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

export default function BetDetailPage() {
  const params = useParams();
  const paramId = params.id;
  const betId =
    typeof paramId === "string"
      ? paramId
      : Array.isArray(paramId)
        ? (paramId[0] ?? "")
        : "";

  // TODO: Implement useBet hook when available.
  const bet = null;
  const isLoading = false;
  const error: unknown = null;

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
        <CenteredErrorState
          error={error}
          fallbackMessage="Apuesta no encontrada o hook pendiente de implementacion."
          backHref="/bets"
          backLabel="Volver a apuestas"
        />
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
            <CardTitle>Informacion pendiente</CardTitle>
            <CardDescription>
              Esta pagina se completara cuando el hook useBet este implementado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Campos a mostrar: stake, odds, bookmaker, description y status.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
