import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a MatBett - Tu gestor de matched betting
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promociones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground text-xs">
              Promociones en curso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Depósitos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0</div>
            <p className="text-muted-foreground text-xs">
              Total depositado este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Beneficio Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0</div>
            <p className="text-muted-foreground text-xs">
              Ganancias acumuladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Apuestas Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground text-xs">
              Total de apuestas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Acciones Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/promotions/new">
            <Button className="w-full" size="lg">
              Nueva Promoción
            </Button>
          </Link>
          <Link href="/deposits/new">
            <Button className="w-full" variant="outline" size="lg">
              Registrar Depósito
            </Button>
          </Link>
          <Link href="/bets/new">
            <Button className="w-full" variant="outline" size="lg">
              Nueva Apuesta
            </Button>
          </Link>
          <Link href="/promotions">
            <Button className="w-full" variant="outline" size="lg">
              Ver Promociones
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas acciones realizadas en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground py-8 text-center">
              No hay actividad reciente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Promociones</CardTitle>
            <CardDescription>
              Promociones que vencen próximamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground py-8 text-center">
              No hay promociones próximas a vencer
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
