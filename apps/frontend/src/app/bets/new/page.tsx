"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NewBetPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/bets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a apuestas
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nueva Apuesta</h1>
          <p className="text-muted-foreground">Registra una nueva apuesta</p>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* TODO: Implementar BetForm component */}
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            Formulario de apuesta pendiente de implementación
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Se creará con los campos: bookmaker, stake, odds, description, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
