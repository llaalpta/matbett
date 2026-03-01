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

type BetListItem = {
  id: string;
  description: string;
  stake: number;
  bookmaker: string;
  odds: number;
  status: string;
};

export default function BetsPage() {
  // TODO: Implement useBets hook when available.
  const bets: BetListItem[] = [];
  const isLoading = false;
  const error: unknown = null;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p>Cargando apuestas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <CenteredErrorState
          error={error}
          fallbackMessage="No se pudieron cargar las apuestas."
          backHref="/"
          backLabel="Volver al inicio"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Apuestas</h1>
          <p className="text-muted-foreground">Gestiona todas tus apuestas</p>
        </div>
        <Link href="/bets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva apuesta
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bets.map((bet) => (
          <Card key={bet.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{bet.description}</span>
                <span className="text-muted-foreground text-sm font-normal">
                  EUR {bet.stake}
                </span>
              </CardTitle>
              <CardDescription>
                {bet.bookmaker} - Cuota: {bet.odds}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <p className="text-muted-foreground text-sm">
                  Estado: {bet.status}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Link href={`/bets/${bet.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/bets/${bet.id}/edit`}>
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

        {bets.length === 0 ? (
          <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">
              No tienes apuestas registradas.
            </p>
            <Link href="/bets/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registrar tu primera apuesta
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
