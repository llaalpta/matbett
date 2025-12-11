# 🦁 MatBett Monorepo

**Matched Betting Tracking Application**
Full-stack TypeScript monorepo diseñado con **tRPC**, **Prisma** y **Next.js**.

---

## 🗺️ Mapa de Documentación

Este proyecto es modular. Aquí tienes dónde encontrar la información detallada de cada parte:

### 📱 Aplicaciones
| Módulo | Descripción | Documentación |
| :--- | :--- | :--- |
| **Frontend** | Interfaz Web (Next.js + React) | [Ver README](apps/frontend/README.md) |
| **Backend** | API Server & Base de Datos | [Ver README](apps/backend/README.md) |

### 📦 Paquetes Compartidos
| Paquete | Descripción | Documentación |
| :--- | :--- | :--- |
| **@matbett/api** | Contrato tRPC (Routers) | [Ver README](packages/api/README.md) |
| **@matbett/shared** | Schemas Zod & Tipos | [Ver README](packages/shared/README.md) |

### 📘 Guías Técnicas Profundas
Documentación específica sobre lógica de negocio compleja:
- [**Algoritmo de Promociones:**](docs/PROMOTION_LOGIC.md) Explicación detallada de la estrategia "Application-Side IDs" y persistencia atómica.

---

## 🚀 Quick Start (Todo el Sistema)

Si solo quieres arrancar el proyecto completo, sigue estos pasos:

### 1. Instalación
```bash
# Instalar dependencias en todo el monorepo
pnpm install
```

### 2. Base de Datos
Necesitas Docker corriendo.
```bash
# Levantar PostgreSQL
cd apps/backend && pnpm docker:up

# Sincronizar esquema y generar cliente
cd apps/backend && pnpm prisma:migrate
```

### 3. Desarrollo
```bash
# Desde la raíz, levanta Frontend y Backend en paralelo
pnpm dev
```
La app estará disponible en `http://localhost:3000`.

---

## 🏗️ Arquitectura del Sistema

El proyecto utiliza una arquitectura de **Monorepo** desacoplada.

```mermaid
graph TD
    subgraph "Packages (Librerías)"
        SHARED[packages/shared\n(Zod Schemas)]
        API[packages/api\n(tRPC Routers)]
    end

    subgraph "Apps (Ejecutables)"
        BACK[apps/backend\n(Node.js + DB)]
        FRONT[apps/frontend\n(Next.js)]
    end

    SHARED --> API
    SHARED --> BACK
    SHARED --> FRONT
    
    API --> FRONT
    API -.->|Implementa| BACK
```

### Principios Clave

1.  **Single Source of Truth:** Todos los tipos y validaciones nacen en `packages/shared`.
2.  **Type Safety End-to-End:** El frontend infiere tipos del backend via tRPC. No hay tipos duplicados manualmente.
3.  **Atomicidad:** Las operaciones de escritura complejas (Promociones) usan transacciones atómicas generadas en el backend.

---

## 🛠️ Comandos Globales

Estos comandos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `pnpm dev` | Inicia todo el entorno de desarrollo. |
| `pnpm build` | Compila todos los paquetes y apps. |
| `pnpm ts` | Ejecuta chequeo de tipos TypeScript en todo el proyecto. |
| `pnpm lint` | Analiza el código en busca de errores de estilo. |
| `pnpm format` | Formatea el código con Prettier. |
| `pnpm clean` | Limpia carpetas `node_modules` y `dist`. |

---

## 📏 Reglas de Oro (Para Desarrolladores)

1.  **NUNCA** definas un Schema Zod en el frontend o backend. Hazlo en `packages/shared`.
2.  **NUNCA** importes código de `apps/backend` dentro de `apps/frontend`. Usa `@matbett/api`.
3.  **SIEMPRE** usa `superjson`. Los objetos `Date` deben viajar como objetos, no como strings.
4.  **SIEMPRE** valida inputs en el Backend. No confíes en la validación del cliente.

---

*Documentación generada el 29 de Noviembre de 2025*