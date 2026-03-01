# Timeframe Refactor Plan (No Legacy / No Backward Compatibility)

## Scope and Decision

This project is in development stage. We explicitly choose:

- No backward compatibility.
- No dual schemas (old + new).
- No migration adapters for old payloads.
- Direct refactor to final model.

This document is the formal reference for timeframe, anchors, and temporary IDs.

## Entry Points (Frontend)

- `PromotionForm` (hierarchy complete: promotion -> phase -> reward -> qualifyCondition)
- `RewardStandaloneForm` (reward + qualifyConditions + usage + usage tracking)
- `QualifyConditionStandaloneForm` (future, for qualify condition tracking)

Out of scope:
- `PhaseStandaloneForm` (won't exist)

---

## Formal Design Rules

1. Single source of truth for validation
- Shared schemas in `packages/shared` define the contract.
- Frontend and backend types are inferred from those schemas.

2. Separation of concerns
- `AnchorCatalog`: selectable anchors by structure (what can be referenced).
- `AnchorOccurrences`: happened events with dates (what already occurred).
- Timeframe rule editing must depend on catalog, not on occurrences.

3. Relative timeframe persistence
- `RELATIVE` persists only rule data:
  - `anchorRef`
  - `offsetDays` (and any rule metadata, if needed)
- Derived dates are not persisted as source of truth.

4. Temporary identity
- New client nodes must have stable `clientId` from creation:
  - phase
  - reward
  - qualifyCondition
- `clientId` remains stable during the whole form session.

5. Anchor references
- Anchor reference must identify entity by:
  - `entityType`
  - `entityRefType` (`client` or `persisted`)
  - `entityRef` (id or clientId)
  - `event`

6. UI/Domain boundaries
- Components: rendering and UI-only state.
- Domain hooks: data rules and handlers.
- Form hooks: `useForm`, resolver, defaults, reset/rehydrate.

7. No type assertions policy
- Keep existing lint policy:
  - no `as any`
  - no generic `as Type`
  - allow `as const`
- Prefer explicit typed builders and `satisfies` where necessary.

---

## Target Data Model

### Timeframe
- `ABSOLUTE`: explicit date bounds.
- `RELATIVE`: rule based on anchor reference + offset.
- `INHERITED`: unchanged concept, but references same canonical model.

### Anchor Data APIs
- Catalog endpoint: returns selectable anchors for a context (promotion tree).
- Occurrences endpoint: returns only resolved dates for occurred events.
- Never mix both concerns in a single ad-hoc DTO.

---

## Execution Plan (Checklist)

## Phase 1 - Shared contracts (blocking)
- [x] Refactor `packages/shared/src/schemas/timeframe.schema.ts` to final shape.
- [x] Remove legacy fields from relative timeframe persistence model.
- [x] Define `AnchorCatalog` and `AnchorOccurrences` schemas/types.
- [x] Add/standardize `clientId` in creation/edit schemas for nested entities.
- [x] Align enum unions/events across `schemas/enums.ts` and `options.ts`.

DoD:
- [x] `pnpm --filter @matbett/shared lint`
- [x] `pnpm --filter @matbett/shared type-check`

## Phase 2 - Backend contract and transformers
- [x] Update API/service contracts to return catalog and occurrences separately.
- [x] Rewrite timeframe resolver against new `anchorRef`.
- [x] Update promotion/reward transformers to resolve `clientId -> persisted id`.
- [x] Remove deduplication behavior that breaks explicit identity references.
- [x] Remove dead paths/functions tied to old mixed timeframe DTO.

DoD:
- [x] `pnpm --filter @matbett/backend lint`
- [x] `pnpm --filter @matbett/backend type-check`

## Phase 3 - Frontend form refactor
- [x] `TimeframeForm` uses `AnchorCatalog` for selectors.
- [x] `useTimeframeFormLogic` uses occurrences only for preview/resolution.
- [x] Ensure create flow works without persisted ids via `clientId`.
- [x] Ensure edit flow supports mixed nodes (persisted + new).
- [x] Keep path builders per entity module, no duplicated inline path blocks.

DoD:
- [x] lint touched frontend files
- [x] type-check frontend

## Phase 4 - Integration and cleanup
- [x] Introduce shared `AnchorContext` composition for all entry points:
  - [x] promotion form
  - [x] reward standalone
  - [x] qualify-condition standalone (form scaffold + shared anchor context)
  - [x] qualify-condition standalone extracted to dedicated domain hook (`useQualifyConditionStandaloneLogic`)
- [x] Define effective catalog algorithm explicitly:
  - `effectiveCatalog = baseCatalog + draftAdded - draftRemoved`
  - `baseCatalog`: backend persisted snapshot
  - `draftAdded`: in-session client entities
  - `draftRemoved`: persisted refs deleted in session
- [x] Add in-session removed refs tracking (`entityType + refType + ref`) and apply it in catalog merge (promotion + reward standalone).
- [x] Validate dangling references:
  - if a deleted anchor is still referenced by a relative timeframe, clear stale selection in form and reject invalid anchors in backend.
- [x] Remove obsolete fields/usages from all layers.
  - [x] `entityRefType` en `TimeframeAnchorRef` ya no es opcional (sin fallback legacy).
  - [x] limpieza de utilidades frontend de query keys deprecadas (`promotionQueryKeys`).
  - [x] eliminada dependencia de `rewardType` placeholder (`""`) en standalone QC y limpieza del prop no necesario.
- [x] Remove unused endpoints/helpers from old model.
  - [x] audit rapido de routers/services/hooks: no quedan endpoints mezclados de timeframe ni helpers legacy en uso.
- [ ] Verify end-to-end:
  - [x] create promotion with relative references to non-persisted nodes
  - [x] edit promotion with mixed persisted/new nodes
  - [x] standalone reward edit with promotion pool access
  - [ ] standalone qualify-condition edit with promotion pool access (future)

DoD:
- [x] all package-level lint/type-check commands pass for touched areas

---

## Suggested Commit Sequence

1. `shared: redefine timeframe + anchor catalog/occurrence + clientId contracts`
2. `backend: adapt services/transformers to new anchorRef and id resolution`
3. `frontend: refactor timeframe form/logic to catalog-first model`
4. `frontend: propagate clientId flow in promotion/phase/reward/qc forms`
5. `cleanup: remove obsolete legacy fields/endpoints/helpers`

---

## Working Agreements (for future tasks)

- Any timeframe change must start from `packages/shared` contract.
- No incremental compatibility layers unless explicitly requested later.
- Every changed file must pass local lint/type-check before moving to next step.
- Prefer explicit, minimal abstractions over generic meta-helpers.

