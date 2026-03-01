# Promotion Persistence Logic

## Scope

This document describes how promotion trees are persisted and updated atomically.

## Problem

A promotion is a nested graph:

- Promotion
- Phases
- Rewards
- Qualify conditions

Naive sequential inserts/updates increase query count and risk partial writes.

## Strategy

Use backend-side graph construction and transactional nested writes.

### Key Principles

1. Build the full persistence payload before writing.
2. Resolve references (`id` / `clientId`) inside the backend transformer layer.
3. Execute a single transaction for each mutation.
4. Keep contract validation in shared schemas.

## Create Flow

1. Validate input with shared schema.
2. Build nested create payload for promotion tree.
3. Persist with Prisma in one transaction.
4. Return normalized entity graph.

## Update Flow

Update is a hybrid operation:

1. Match incoming nodes with persisted nodes.
2. Compute create/update/delete sets per level.
3. Apply nested updates with referential guards.
4. Enforce delete rules (no parent deletion when blocked by children/usages).

## Delete Rules

- `promotion.delete`: cascade delete allowed (with explicit UI confirmation).
- `phase.delete`: blocked when rewards exist.
- `reward.delete`: blocked when qualify conditions exist.
- `qualifyCondition.delete`: blocked when linked/used by tracking dependencies.

## Ownership by Layer

- `packages/shared`: contracts and validation.
- `packages/api`: router contract.
- `apps/backend/src/lib/transformers`: payload assembly.
- `apps/backend/src/services`: orchestration and transaction boundaries.
- `apps/backend/src/repositories`: Prisma access.

## References

- `apps/backend/src/services/promotion.service.ts`
- `apps/backend/src/lib/transformers/promotion.transformer.ts`
- `packages/shared/src/schemas/promotion.schema.ts`
