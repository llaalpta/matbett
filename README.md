# MatBett Monorepo

Type-safe matched betting tracker built as a TypeScript monorepo.

## Purpose

MatBett models promotions, phases, rewards, qualify conditions, deposits, and betting calculations with a shared contract between frontend and backend.

## Repository Layout

- `apps/frontend`: Next.js application.
- `apps/backend`: Express + tRPC + Prisma backend.
- `packages/api`: tRPC router contract shared by frontend/backend.
- `packages/shared`: Zod schemas, inferred types, and shared options.
- `docs`: technical documentation index and living guides.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (for local PostgreSQL)

## Quick Start

```bash
pnpm install
cd apps/backend
pnpm docker:up
pnpm prisma:migrate
cd ../..
pnpm dev
```

Frontend runs at `http://localhost:3000`.

## Global Commands

- `pnpm dev`: run frontend and backend in parallel.
- `pnpm build`: build all packages/apps.
- `pnpm ts`: global TypeScript check.
- `pnpm lint`: global lint.
- `pnpm format`: format workspace files.

## Development Rules

- Domain schemas live only in `packages/shared`.
- API contract lives only in `packages/api`.
- Frontend must not import backend runtime code.
- Use `Date` objects end-to-end (`superjson`).

## Documentation

Start here: `docs/README.md`.
