"use client";

import type { Deposit } from "@matbett/shared";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useCreateDeposit } from "@/hooks/api/useDeposits";

type DepositFormData = Deposit;

export default function NewDepositPage() {
  const router = useRouter();
  const createDeposit = useCreateDeposit();

  // TODO: Implementar cuando DepositForm esté disponible
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = async (data: DepositFormData) => {
    try {
      await createDeposit.mutateAsync(data);
      router.push("/deposits");
    } catch (error) {
      console.error("Error creating deposit:", error);
      // TODO: Agregar manejo de errores con toast/notification
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/deposits">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a depósitos
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Depósito</h1>
          <p className="text-muted-foreground">
            Registra un nuevo depósito en tu casa de apuestas
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* TODO: Implementar DepositForm component */}
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            Formulario de depósito pendiente de implementación
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Se creará con los campos: bookmaker, amount, promotionContext, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
