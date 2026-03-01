"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NewDepositPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/deposits">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a depositos
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo deposito</h1>
          <p className="text-muted-foreground">
            Registra un nuevo deposito en tu casa de apuestas.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            Formulario de deposito pendiente de implementacion.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Se creara con los campos: bookmaker, amount y promotionContext.
          </p>
        </div>
      </div>
    </div>
  );
}
