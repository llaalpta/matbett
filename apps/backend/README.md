# Backend (apps/backend)

Express + tRPC + Prisma backend for MatBett.

## Purpose

Implements domain services, persistence, and transactional workflows behind the shared tRPC contract.

## Stack

- Node.js 20+
- Express 5
- tRPC server
- Prisma 7
- PostgreSQL 16
- Zod via `@matbett/shared`

## Run

```bash
pnpm dev
```

## Database Commands

```bash
pnpm docker:up
pnpm docker:down
pnpm prisma:migrate
pnpm prisma:generate
pnpm prisma:studio
pnpm prisma:migrate:reset
```

## Architecture

- `src/services`: business workflows and transaction orchestration.
- `src/repositories`: persistence access wrappers.
- `src/lib/transformers`: DTO -> Prisma graph transformations.
- `src/trpc`: context and procedure plumbing.

## Backend Conventions

- Read this file before implementing backend changes.
- Keep router definitions in `packages/api`; backend only provides implementations via context services.
- Do not edit migration SQL manually; change `schema.prisma` and run Prisma migrations.
- Parse and validate JSON fields with shared schemas.
- Keep one business operation inside one transaction scope.
- Keep structure aligned with `router -> service -> repository/transformer`.
- Validate ownership and identifier consistency before applying update diffs.
- Prefer extracting repeated sub-workflows into private service helpers instead of duplicating create/update loops inline.
- Keep repositories focused on persistence access and transformers focused on mapping; business rules stay in services.

## Related Docs

- Root docs index: `../../docs/README.md`
- Promotion persistence logic: `../../docs/promotion-logic.md`
- Docker setup: `./docker/README.md`
