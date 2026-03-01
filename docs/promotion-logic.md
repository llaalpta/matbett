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

## Lifecycle Gating

When editing persisted rewards and qualify conditions, the system should separate:

- structural editing of the definition
- lifecycle/status updates
- runtime actions such as contextual bet/deposit registration

Reward rules:

- reward definition, usage conditions, and qualify condition composition are editable only while the reward is `QUALIFYING`
- if the parent promotion or phase is already `COMPLETED` or `EXPIRED`, structural editing must stay locked even if the reward status is stale
- recalculating tracking after registering bets or deposits must only update tracking payloads, contribution snapshots, and balances; it must never mutate entity statuses for reward, qualify condition, or usage tracking
- reward status changes are always manual, but they must still respect lifecycle invariants:
  - `PENDING_TO_CLAIM`, `CLAIMED`, `RECEIVED`, `IN_USE`, and `USED` require all linked qualify conditions to be `FULFILLED`
  - `PENDING_TO_CLAIM` and `CLAIMED` only make sense for rewards with manual claim methods
  - when a reward first reaches a usable state manually (`RECEIVED`, `IN_USE`, `USED`), the backend must ensure `usageTracking` exists
- contextual bet usage launchers only appear for bet-usable reward types and must only be enabled when:
  - the reward is persisted
  - the reward status is `RECEIVED` or `IN_USE`
  - usage tracking exists and still has consumable metrics/context
  - parent promotion and phase are both `ACTIVE`

Qualify condition rules:

- qualify condition definition fields are editable only while the condition is `PENDING` or `QUALIFYING`
- if the parent reward is no longer `QUALIFYING`, the qualify condition definition must be locked
- contextual bet registration for a qualify condition must only be enabled when:
  - the condition is persisted
  - the condition type is bet-applicable
  - the condition status is `PENDING` or `QUALIFYING`
  - the parent reward status is `QUALIFYING`
  - parent promotion and phase are both `ACTIVE`

Reward status selectors may remain editable when the reward definition is locked, so lifecycle corrections can still be made without reopening structural fields.

Qualify condition status is different: once the parent reward leaves `QUALIFYING`, the qualify condition is frozen entirely, including its status selector.

These rules should be enforced in both places:

- frontend, to project the lifecycle clearly and avoid misleading affordances
- backend services, to prevent crafted payloads from bypassing the intended workflow
