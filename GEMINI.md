# Claude/AI Instructions - MatBett Project

## Contexto del Proyecto

**MatBett** es una aplicación de matched betting full-stack (Next.js + Express + Prisma) organizada en un monorepo type-safe.

### Arquitectura

```text
matbett/
├── apps/
│   ├── backend/           # Express + Prisma + tRPC Server (Implementación)
│   └── frontend/          # Next.js + TanStack Query (Consumo)
└── packages/
    ├── shared/            # ⭐ FUENTE DE VERDAD - Schemas Zod + Options
    └── api/               # Contrato tRPC (Routers y Tipos públicos)
```

**Documentación Adicional:**
*   **Frontend Architecture:** Ver `apps/frontend/README.md` para detalles específicos de UI, gestión de estado y formularios.

### Stack Tecnológico

- **Schemas:** Zod 3.23.8 (Validación runtime y source of truth)
- **API:** tRPC v11 (Type-safety end-to-end)
- **ORM:** Prisma v6+ (PostgreSQL)
- **Persistencia:** Application-Side IDs (`cuid2`) + Nested Writes
- **Serialización:** `superjson` (Fechas, Map, Set) + `fast-json-stable-stringify` (Hashing)
- **Tipos:** TypeScript strict mode, NO `any` permitido

---

## 🛠️ Cómo Analizar Errores (Debugging Strategy)

Antes de proponer cambios, sigue esta estrategia para identificar la causa raíz sin necesidad de compilar todo el proyecto:

### 1. Diagnóstico Estático (VS Code Diagnostics)
Usa la herramienta `mcp__ide__getDiagnostics` (si está disponible) para ver errores de TypeScript en tiempo real.
- **Ventaja:** Es mucho más rápido que `pnpm tsc` y da contexto de archivo/línea exacto.
- **Uso:** Ejecuta `getDiagnostics` en los archivos que sospechas que fallan.
- **Alternativa:** Si no tienes acceso a `getDiagnostics`, usa `pnpm tsc --noEmit` o `eslint` para verificar la corrección del código.

### 2. Verificar Definiciones
- Si el error es de tipos (`Property 'X' does not exist on type 'Y'`), verifica primero `packages/shared/src/schemas`.
- Si el error es de Prisma, verifica `apps/backend/prisma/schema.prisma` y si se ejecutó `pnpm prisma generate`.

### 3. Verificar Imports
- Asegúrate de que no se estén importando rutas relativas profundas entre paquetes (`../../backend/src/...`). Siempre usar `@matbett/api` o `@matbett/shared`.

---

## Reglas de Arquitectura (CRÍTICAS)

### ✅ DO (Hacer SIEMPRE)

1. **Schemas en shared son la fuente de verdad**
   - Prisma debe adaptarse a los schemas, NO al revés.
   - Definir primero en `packages/shared/schemas`, luego actualizar `schema.prisma`.

2. **Arquitectura modular para entidades polimórficas**
   - Usar `Discriminated Unions` en Zod.
   - Patrón: `BaseSchema` + `SpecificSchema` (por tipo) = `CombinedSchema`.
   - `EntitySchema` = `CombinedSchema` + campos DB (`id`, `timestamps`).

3. **Manejo correcto de null vs undefined**
   - `.nullish()`: Campos opcionales de Prisma (`String?`) → acepta `null | undefined`.
   - `.nullable()`: Timestamps (`DateTime?`) → solo `Date | null`.
   - `.optional()`: Solo para campos de formulario puros que se pueden omitir.

4. **Patrón de Persistencia Atomic (Nested Writes)**
   - **Backend genera IDs:** Usar `createId()` de `@paralleldrive/cuid2` en los Transformers.
   - **Construcción de Grafos:** El Transformer construye el payload completo (`create`, `connect`) en memoria.
   - **Una sola query:** `prisma.promotion.create({...})` maneja la transacción implícita. NUNCA usar bucles `for` con `await` para insertar hijos secuencialmente.

5. **Deduplicación por Hash**
   - Usar `fast-json-stable-stringify` para calcular hashes de objetos JSON (condiciones).
   - Usar `Map<hash, id>` en los transformers para evitar crear duplicados en BD.

6. **Safety First en Transformers**
   - Usar helpers defensivos como `getConditionIdOrThrow` en lugar de `!`.
   - Usar `switch` exhaustivo con `throw` por defecto para parsear campos JSON polimórficos.
   - **Parsear siempre:** `MySchema.parse(prisma.jsonField)`. Nunca castear con `as`.

7. **Imports estrictos**
   - Frontend: `@matbett/shared`, `@matbett/api`.
   - Backend: `@matbett/shared`, `@prisma/client`, `@/lib/transformers`.
   - Routers: Importan Contexto (`ctx`), no Servicios directamente.

8. **Configuración de Fechas**
   - Usar `superjson` en ambos extremos (backend y frontend) para preservar objetos `Date`.
   - No convertir manualmente strings ISO a Date en los componentes.

9. **Formularios Agnósticos**
   - Los componentes de formulario (`RewardForm`, `PhaseForm`, etc.) deben ser agnósticos de su ubicación.
   - Deben funcionar tanto anidados (dentro de `PromotionForm`) como standalone (`RewardStandaloneForm`).
   - Usar `FormProvider` y `useFormContext` para acceder al estado.
   - Manejar `fieldPath` flexible: si está vacío, mapear a campos raíz; si tiene valor, mapear a nested fields.

### ❌ DON'T (NUNCA hacer)

1. **No duplicar schemas:** Un solo lugar → `packages/shared`.
2. **No usar `any`:** ESLint configurado para error. PROHIBIDO USAR `any` o inferencias débiles. Tipar todo estrictamente.
3. **No definir enums separados:** Derivar de `options.ts` con `getValues()`.
4. **No validar datos de Prisma:** Ya están validados por el ORM (salvo campos JSON).
5. **No mezclar capas:** El Servicio no construye objetos JSON manuales; el Transformer lo hace. El Router no tiene lógica de negocio; el Servicio la tiene.
6. **No usar transacciones manuales innecesarias:** Preferir Nested Writes siempre que sea posible.
7. **No modificar código sin leer:** Usa `read_file` antes de `edit_file` (o `replace`) para entender el contexto exacto y evitar errores de sustitución.

---

## Flujo de Trabajo para Nuevas Features

### 1. Orden de Implementación (SIEMPRE)

```
1. Schemas (packages/shared)
   ├─ Crear/modificar schemas Zod
   └─ Exportar desde index.ts

2. Prisma (apps/backend)
   ├─ Actualizar schema.prisma
   └─ pnpm prisma migrate dev && pnpm prisma generate

3. Transformers (apps/backend/src/lib/transformers)
   ├─ Crear funciones `toEntity` (Output)
   └─ Crear funciones `toCreateInput`/`toUpdateInput` (Input con IDs)

4. Repositorios & Servicios (apps/backend)
   ├─ Repositorio: Wrapper simple de Prisma
   └─ Servicio: Orquestador (Valida → Transforma → Persiste)

5. tRPC Routers (packages/api)
   └─ Definir procedures y tipos de entrada/salida

6. Frontend (apps/frontend)
   └─ Consumir tipos inferidos de @matbett/api
```

### 2. Testing Durante Desarrollo

```bash
# Verificar tipos sin compilar (MUY RÁPIDO - Prioritario)
# Usa la herramienta mcp__ide__getDiagnostics primero si es posible.

# Verificar validación de Prisma
pnpm prisma validate
```

---

## Patrones de Código (Copy-Paste)

### Transformer de Creación (Nested Writes + Hashing)

```typescript
import { createId } from '@paralleldrive/cuid2';
import stringify from 'fast-json-stable-stringify';

export function toCreateInput(data: DomainType, userId: string) {
  return {
    // ... campos simples
    children: {
      create: data.children.map(child => {
        // Lógica de hashing si es necesaria deduplicación
        const hash = stringify(child.config);
        // ...
        return {
           id: createId(), // ID generado en backend
           // ...
        };
      })
    }
  };
}
```

### Transformer de Lectura (Safety Switch)

```typescript
export function toEntity(prisma: PrismaType): EntityType {
  // Parsear campos JSON
  const config = ConfigSchema.parse(prisma.config);

  switch (prisma.type) {
    case 'TYPE_A':
      return { ...base, type: 'TYPE_A', config };
    case 'TYPE_B':
      return { ...base, type: 'TYPE_B', config };
    default:
      throw new Error(`Tipo no soportado: ${prisma.type}`);
  }
}
```

---

## Comandos de Referencia

```bash
# Desarrollo
pnpm dev

# Prisma
pnpm prisma generate
pnpm prisma migrate dev --name <name>
pnpm prisma studio

# TypeScript Check (Global)
pnpm tsc -b # Use build mode for composite projects
```

**Nota:** Antes de modificar código complejo, leer `docs/PROMOTION_LOGIC.md`.

# Operational Guidelines & Best Practices (CRITICAL)

## 1. Safe Editing & Verification
- **Read Before Edit:** ALWAYS use `read_file` to inspect the file content *immediately before* applying any changes. This ensures you are targeting existing text accurately and avoiding "search string not found" errors.
- **Granular Edits (Prefer `replace`):**
    - ALWAYS prefer replacing specific blocks of code (functions, interfaces, imports) over rewriting the entire file (`write_file`).
    - **Avoid Duplication:** Be extremely careful not to append new code to the end of a file while leaving the old code in place. Ensure your `old_string` in `replace` calls correctly targets the code to be removed/updated.
- **Avoid `write_file` for Existing Files:** Use `write_file` ONLY for creating *new* files. For existing files, use `replace`.
- **Cascading Checks:** When you modify code, immediately identify and check any dependent code (e.g., imports, usages in other files) to ensure no breaking changes are introduced. Adapt dependent code as necessary.
- **Verify Correctness:**
    - After ANY code change, verify that the code is syntactically correct and free of linter/TypeScript errors.
    - **Use Diagnostics:** Prefer checking for errors using IDE-like diagnostics (e.g., looking for "Problems" via `run_shell_command` with `eslint` or `tsc`) *without* necessarily running a full heavy build if possible.
    - **Strict Typing:** **PROHIBITED:** Do not use `any`. Do not rely on loose type inference that results in `any`. Explicitly type everything. Ensure linter rules enforce this.

## 2. Development Workflow
- **Prefer Editing over Creating:** When adding functionality that relates to existing features, always try to *edit* the existing files and structures rather than creating new, duplicate, or parallel files unless explicitly instructed.
- **Deep Review of Dependencies:** When reviewing a flow (e.g., "Promotion Creation"), you MUST review the code of all child components (`RewardForm`, `PhaseForm`) and their logic hooks (`useRewardLogic`) to identify errors or type mismatches. Do not assume they work just because the parent compiles.
- **Retry on Cancellation:** If a user cancels a tool call (e.g., rejects a proposed code change), **DO NOT SKIP** the task. You must analyze *why* it might have been rejected (or ask), and then propose a *corrected* or alternative solution for that specific problem. Do not move on to the next task until the current one is resolved or explicitly skipped by the user.

## 3. Task Management
- **Maintain Todo List:** Keep the `write_todos` list up-to-date.
- **Completion Check:** Before declaring interaction finished or asking "what's next?", review the todo list. Verify that:
    - All code changes are actually applied.
    - No files are left in a broken or half-modified state.
    - All verification steps (lint/types) have passed.

## 4. Handling Ambiguity & Incomplete Tasks
- **Propose Solutions:** If a task is blocked or cannot be fully completed (e.g., missing infrastructure, conflicting instructions), **DO NOT** simply stop or log the issue. You **MUST** explicitly explain the blocker to the user and propose 2-3 concrete solutions (with pros/cons) to resolve it. Ask the user for their preference.
- **Explicit Confirmation:** Do not mark a task as "completed" if a sub-task was skipped or left in a "documented but not fixed" state without user approval.

## 5. Unused Code & Cleanup Strategy
- **Analyze Before Deleting:** When you see "unused" code (imports, variables, functions), **DO NOT** blindly delete it.
- **Ask "Why?":** Ask yourself: *Why is this here?* Is it a leftover from a deleted feature? Or is it a *placeholder* for a future feature (e.g., `createPaginatedResponseSchema` implies a future `list` endpoint)?
- **Consult the User:** If the code implies missing functionality (like a missing endpoint), **ASK THE USER** if they want to implement the missing feature or remove the code. Document this decision.

## Tool Usage
- **Parallelism:** Execute multiple independent tool calls in parallel when feasible (i.e. searching the codebase).
- **Command Execution:** Use the 'run_shell_command' tool for running shell commands, remembering the safety rule to explain modifying commands first.
- **Background Processes:** Use background processes (via `&`) for commands that are unlikely to stop on their own, e.g. `node server.js &`. If unsure, ask the user.
- **Interactive Commands:** Prefer non-interactive commands when it makes sense; however, some commands are only interactive and expect user input during their execution (e.g. ssh, vim). If you choose to execute an interactive command consider letting the user know they can press `ctrl + f` to focus into the shell to provide input.
- **Remembering Facts:** Use the 'save_memory' tool to remember specific, *user-related* facts or preferences when the user explicitly asks, or when they state a clear, concise piece of information that would help personalize or streamline *your future interactions with them* (e.g., preferred coding style, common project paths they use, personal tool aliases). This tool is for user-specific information that should persist across sessions. Do *not* use it for general project context or information. If unsure whether to save something, you can ask the user, "Should I remember that for you?"
- **Respect User Confirmations:** Most tool calls (also denoted as 'function calls') will first require confirmation from the user, where they will either approve or cancel the function call. If a user cancels a function call, respect their choice and do _not_ try to make the function call again. It is okay to request the tool call again _only_ if the user requests that same tool call on a subsequent prompt. When a user cancels a function call, assume best intentions from the user and consider inquiring if they prefer any alternative paths forward.
