# Shared Domain (packages/shared)

Single source of truth for domain schemas and inferred types.

## Purpose

Centralize domain validation and shared options used across frontend and backend.

## Scope

- Zod schemas (`src/schemas`)
- Shared options/constants (`src/options.ts`)
- Re-exported inferred types (`src/index.ts`)

## Conventions

- Add new domain fields here first.
- Infer TypeScript types from Zod; avoid manual duplicate interfaces.
- Keep schemas modular and composable.

## Usage

- Frontend: form validation + strong typing.
- Backend: procedure input validation + runtime parsing.
- API package: contract composition.

## Commands

```bash
pnpm build
pnpm lint
pnpm type-check
```
