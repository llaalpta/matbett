# API Contract (packages/api)

Shared tRPC router contract for MatBett.

## Purpose

Defines procedures and I/O contracts consumed by frontend and implemented by backend services.

## Scope

This package contains contract definitions only:

- Router declarations
- Procedure input/output validation binding
- Root router composition
- Exported router types

It does not contain runtime persistence logic.

## Structure

- `src/routers`: feature routers.
- `src/root.ts`: app router composition.
- `src/context.ts`: context interfaces used by implementations.
- `src/index.ts`: public exports.

## Usage

Frontend imports `AppRouter` types for typed client calls.
Backend wires `appRouter` with service implementations in context.

## Commands

```bash
pnpm build
pnpm lint
pnpm type-check
```
