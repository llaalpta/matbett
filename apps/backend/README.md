# 🛠️ MatBett Backend

Servidor API robusto construido con **Express**, **Prisma** y **tRPC**. Actúa como la capa de implementación de la lógica de negocio y acceso a datos del monorepo.

---

## ⚡ Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 5
- **API:** tRPC v11 (Server)
- **Database:** PostgreSQL 16
- **ORM:** Prisma 7
- **Validation:** Zod (via `@matbett/shared`)
- **ID Generation:** `@paralleldrive/cuid2` (Application-Side IDs)
- **Serialization:** `superjson` + `fast-json-stable-stringify`

---

## 🏗️ Estructura del Proyecto

```text
apps/backend/
├── src/
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma singleton
│   │   └── transformers/      # ⚙️ Lógica de construcción de grafos (IDs + Hashes)
│   ├── repositories/          # 📦 Acceso a datos puro (Prisma wrappers)
│   ├── services/              # 🧠 Lógica de negocio y transacciones
│   ├── trpc/                  # Configuración tRPC (Context, Procedures)
│   └── server.ts              # Entry point (Inyección de dependencias)
├── prisma/
│   ├── schema.prisma          # Definición del modelo de datos
│   └── migrations/            # Historial SQL
└── docs/                      # Documentación técnica específica
```

---

## 📐 Arquitectura en Capas

El backend sigue una arquitectura estricta de separación de responsabilidades para garantizar mantenibilidad y atomicidad.

### 1. Transformer Layer (`src/lib/transformers/`)
**Responsabilidad:** Convertir DTOs de dominio (Zod) en Payloads de Prisma complejos.
* **Feature Clave:** Implementa el patrón **Application-Side IDs**.
* Genera CUIDs en memoria antes de tocar la BD.
* Calcula hashes para deduplicación de entidades (ej. `QualifyConditions`).
* Construye grafos anidados para *Nested Writes* (`create`, `connect`).

### 2. Service Layer (`src/services/`)
**Responsabilidad:** Orquestar la lógica de negocio.
* Valida inputs usando schemas de `@matbett/shared`.
* Llama a los transformers.
* Ejecuta operaciones atómicas a través de los repositorios.
* **Regla:** Una operación de negocio = Una transacción de base de datos.

### 3. Repository Layer (`src/repositories/`)
**Responsabilidad:** Abstracción sobre Prisma Client.
* Métodos CRUD estándar (`find`, `create`, `update`, `delete`).
* No contiene lógica de negocio compleja.
* Facilita el testing y el mockeo.

### 4. tRPC Layer (`@matbett/api` implementation)
**Responsabilidad:** Exponer la API.
* Los routers **no** contienen lógica. Solo llaman a los servicios inyectados en el `Context`.

---

## 🔄 Flujo de Persistencia (Atomicidad)

Para entidades complejas como **Promociones** (que contienen Fases, Rewards y Condiciones), no usamos inserciones secuenciales.

**Estrategia:**
1.  **Transformer:** Genera todos los IDs necesarios (`cuid2`) y mapea las relaciones en memoria.
2.  **Prisma:** Recibe un único payload gigante con instrucciones anidadas (`create: { ... }`).
3.  **PostgreSQL:** Ejecuta todo en una **sola transacción implícita**.

*Para más detalles, ver `/docs/PROMOTION_CRUD_FLOW.md` en la raíz.*

---

## 🚀 Comandos

### Base de Datos (Docker)
```bash
# Levantar PostgreSQL
pnpm docker:up

# Apagar PostgreSQL
pnpm docker:down
```

### Prisma ORM
```bash
# Aplicar cambios del schema.prisma a la BD (crea migración)
pnpm prisma:migrate

# Regenerar el cliente de Prisma (node_modules)
pnpm prisma:generate

# Abrir interfaz visual para explorar datos
pnpm prisma:studio

# Resetear base de datos (¡Borra todo!)
pnpm prisma:migrate:reset
```

### Desarrollo
```bash
# Iniciar servidor en modo watch
pnpm dev

# Compilar TypeScript
pnpm build
```

---

## 🛑 Reglas de Desarrollo (Backend)

1.  **Nunca importar Routers:** Los routers se definen en `packages/api`. Aquí solo se implementa el contexto.
2.  **Validación:** Siempre validar datos de entrada (`input`) con Zod antes de procesar.
3.  **Fechas:** Usar siempre objetos `Date`. `superjson` se encarga de la serialización en la red.
4.  **Campos JSON:** Al leer de Prisma, parsear siempre los campos `Json` con los schemas de Zod correspondientes (usar `extractQualifyConditions` o similar).
5.  **Migrations:** Nunca editar SQL a mano. Modificar `schema.prisma` y ejecutar `prisma migrate dev`.

---

## 📚 Enlaces Útiles

- [Prisma Docs](https://www.prisma.io/docs)
- [tRPC Server Docs](https://trpc.io/docs/server/adapters/express)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)