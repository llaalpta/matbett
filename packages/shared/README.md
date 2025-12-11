# 📦 MatBett Shared

Este paquete actúa como la **Fuente de Verdad (Source of Truth)** de todo el monorepo. Contiene las definiciones de tipos, validaciones y constantes que comparten el Backend y el Frontend.

> **Regla de Oro:** Si un tipo o validación se usa en más de un lugar, DEBE vivir aquí.

---

## 🛠️ Estructura

```text
src/
├── schemas/           # Schemas de Zod (Validación + Tipos)
│   ├── promotion.schema.ts
│   ├── reward.schema.ts
│   ├── timeframe.schema.ts
│   └── ...
├── options.ts         # Constantes de UI (Selects, Enums)
└── index.ts           # Punto de entrada (Exports)
```

## 🚀 Uso

### 1. Validación de Formularios (Frontend)
Usado con `react-hook-form` y `zodResolver`.

```typescript
import { PromotionSchema } from '@matbett/shared';

const form = useForm({
  resolver: zodResolver(PromotionSchema)
});
```

### 2. Validación de API (Backend/tRPC)
Usado para validar inputs y outputs en los routers.

```typescript
import { PromotionSchema } from '@matbett/shared';

publicProcedure.input(PromotionSchema).mutation(...)
```

### 3. Tipos TypeScript (Inferencia)
No escribas interfaces manuales. Infiérelas de Zod.

```typescript
import type { Promotion } from '@matbett/shared';
// Promotion es z.infer<typeof PromotionSchema>
```

---

## 📏 Convenciones de Schemas

1.  **Modularidad:** Usamos composición (`.extend()`, `.merge()`) para evitar duplicación.
    * `BaseSchema`: Campos comunes.
    * `EntitySchema`: Base + Campos de BD (`id`, `createdAt`).
2.  **Polimorfismo:** Usamos `z.discriminatedUnion` para entidades como `Reward` o `QualifyCondition` que cambian de forma según su `type`.
3.  **Opcionales:**
    * Usa `.nullish()` para campos que pueden ser `null` en BD o `undefined` en JS.
    * Usa `.optional()` para campos de formulario que el usuario puede dejar vacíos.

## 📝 Comandos

```bash
# Build (necesario si cambias algo para que lo vean otros paquetes)
pnpm build

# Type Check
pnpm type-check
```