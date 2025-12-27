# 🎨 MatBett Frontend

Aplicación web moderna construida con **Next.js 15** y **React 19**, diseñada para la gestión de Matched Betting. Actúa como consumidor type-safe de la API del backend mediante **tRPC**.

---

## ⚡ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript 5 (Strict Mode)
- **UI Library:** React 19 + Radix UI
- **Estilos:** Tailwind CSS 4
- **Componentes:** Shadcn/ui (Arquitectura Atómica)
- **Estado/Data:** TanStack Query v5 + tRPC v11
- **Formularios:** React Hook Form + Zod Resolver
- **Fechas:** Date nativos (via `superjson`)

---

## 🏗️ Estructura del Proyecto

```text
src/
├── app/                    # Next.js App Router (Rutas y Pages)
│   ├── promotions/        # Gestión de promociones (CRUD complejo)
│   ├── deposits/          # Gestión de depósitos
│   └── ...
├── components/             # Arquitectura Atómica
│   ├── atoms/             # UI base (Button, Input)
│   ├── molecules/         # Fragmentos de formulario (RewardFormFields)
│   ├── organisms/         # Formularios completos (PromotionForm)
│   ├── providers/         # Contextos (TRPCProvider, ThemeProvider)
│   └── ui/                # Componentes Shadcn (no editar lógica aquí)
├── hooks/                 # Lógica de vista y estado
│   ├── usePromotionForm.ts # Orquestador principal de formularios complejos
│   └── ...
├── lib/                   # Configuración core
│   ├── trpc.ts            # Cliente tRPC + Inferencia de tipos
│   └── utils.ts           # Helpers UI (cn)
├── types/                 # Tipos específicos de UI (NO de dominio)
└── utils/                 # Lógica de cliente pura (Calculadoras Betting)
```

---

## 🔌 Integración con el Monorepo

El frontend es un **consumidor** estricto de los paquetes compartidos.

### 1. Tipado End-to-End (tRPC)
No definimos interfaces de API manualmente. Se infieren directamente del contrato del backend.

```typescript
import type { RouterInputs, RouterOutputs } from "@/lib/trpc";

// ✅ CORRECTO: Inferencia automática
type PromotionList = RouterOutputs["promotion"]["list"];
type CreateData = RouterInputs["promotion"]["create"];

// ❌ INCORRECTO: Tipos manuales
interface Promotion { ... }
```

### 2. Validaciones (Shared Schemas)
Usamos los mismos schemas de Zod que el backend para validar formularios.

```typescript
import { PromotionSchema } from "@matbett/shared";

const form = useForm({
  resolver: zodResolver(PromotionSchema)
});
```

### 3. Manejo de Fechas (SuperJSON)
Gracias a la configuración de `superjson` en `trpc.ts`:
* **Input:** Los componentes envían objetos `Date` nativos.
* **Output:** Recibimos objetos `Date` nativos del backend.
* **Prohibido:** Convertir manualmente a ISO Strings (`toISOString`) para transmisión.

---

## 📝 Patrones de Desarrollo

### Formularios Complejos (Nested Forms)
Para entidades anidadas (Promoción -> Fases -> Rewards), seguimos estas reglas:

1.  **IDs Opcionales (Create vs Update):**
    * Si una entidad anidada (ej. `Phase`) tiene `id`, el backend hará **UPDATE**.
    * Si no tiene `id`, el backend hará **CREATE**.
    * El frontend es responsable de mantener los IDs de los objetos existentes al editar.

2.  **Hook `usePromotionForm`:**
    * Centraliza toda la lógica de estado, tabs y arrays (`useFieldArray`).
    * Los componentes UI (`PhaseTabs`, `RewardCard`) son "tontos" y reciben props o control del hook.

### Sistema de Timeframes V3 (Resolved Dates)
Los timeframes relativos ahora persisten las fechas resueltas (`start`/`end`).
* El frontend usa el hook `useTimeframeFormLogic` para gestionar la lógica de timeframes.
* Las fechas se calculan y persisten en el form antes del submit.
* El backend recalcula las fechas cuando cambian los timestamps de los anchors.

### Calculadoras (Client-Side Logic)
La lógica matemática pesada para el usuario (simulaciones) vive en `src/utils/calculate.ts`.
* **Rollover Analysis:** Rentabilidad de bonos.
* **Matched Betting:** Cálculo de stakes Back/Lay.

---

## 🚀 Comandos

```bash
# Iniciar servidor de desarrollo (puerto 3000)
pnpm dev

# Linting
pnpm lint

# Construcción para producción
pnpm build
```

---

## 🛑 DOs & DON'Ts

| ✅ DO (Hacer) | ❌ DON'T (No hacer) |
| :--- | :--- |
| Usar `trpc.useQuery` para traer datos. | Usar `fetch` o `axios` manualmente. |
| Importar Schemas de `@matbett/shared`. | Redefinir schemas Zod en local. |
| Usar componentes de `@/components/ui`. | Crear estilos CSS custom sin Tailwind. |
| Inferir tipos de `RouterOutputs`. | Usar `any` o interfaces manuales. |
| Enviar `Date` objects al backend. | Convertir fechas a `string` manualmente. |

---

## 📚 Documentación Relacionada

* **Lógica de Negocio:** Ver `docs/PROMOTION_CRUD_FLOW.md` (en raíz) para entender cómo el backend procesa los formularios complejos.
* **Backend API:** Ver `apps/backend/README.md`.