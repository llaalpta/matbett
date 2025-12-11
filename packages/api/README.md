# 🤝 MatBett API Contract

Este paquete define el **Contrato de API** utilizando **tRPC**.
Su único propósito es exponer los Routers y los Tipos de entrada/salida para que el Frontend y el Backend hablen el mismo idioma.

> **Nota:** Este paquete NO contiene lógica de negocio, acceso a base de datos ni secretos. Solo definiciones.

---

## 🛠️ Estructura

```text
src/
├── routers/           # Definición de rutas y procedimientos
│   ├── promotion.ts
│   ├── deposit.ts
│   └── ...
├── root.ts            # AppRouter principal (merge de routers)
├── trpc.ts            # Inicialización de tRPC (publicProcedure)
└── index.ts           # Exports para consumidores
```

## 🚀 Integración

### Consumidor (Frontend)
El frontend importa **solo los tipos** de este paquete. Nunca el código en tiempo de ejecución (para mantener el bundle pequeño).

```typescript
// apps/frontend/src/lib/trpc.ts
import type { AppRouter } from '@matbett/api';

// tRPC infiere automáticamente inputs y outputs basados en este tipo
export const trpc = createTRPCNext<AppRouter>({ ... });
```

### Implementador (Backend)
El backend importa la **implementación** del router para servirla.

```typescript
// apps/backend/src/server.ts
import { appRouter } from '@matbett/api';
import { createContext } from './trpc/context';

createHTTPServer({
  router: appRouter,
  createContext,
});
```

---

## 🔄 Flujo de Desarrollo

1.  **Definir Router:** Crea o edita un archivo en `src/routers/`.
    ```typescript
    export const myRouter = router({
      hello: publicProcedure
        .input(z.string())
        .query(({ input }) => `Hello ${input}`),
    });
    ```
2.  **Exponer en Root:** Añádelo a `src/root.ts`.
3.  **Implementar Lógica:** El router define el *qué*, el servicio en el backend define el *cómo*.
    * *Nota:* Actualmente, para simplificar, los resolvers llaman a `ctx.service` que se inyecta desde el backend.

## 📦 Dependencias

* `@trpc/server`: Núcleo de tRPC.
* `zod`: Para validación de inputs.
* `@matbett/shared`: Para reutilizar schemas de dominio.