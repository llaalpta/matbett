# Lifecycle Policy Refactor Record

## Status

Completed. This document is retained as a functional reference for lifecycle and
status policy decisions. It is no longer the active implementation plan.

Current follow-up work belongs in `docs/backlog.md`.

## Scope

This document records the refactor for centralizing lifecycle and status
rules across frontend and backend for:

- `Promotion`
- `Phase`
- `Reward`
- `QualifyCondition`
- `UsageTracking`

The implemented goal is a single domain policy source that is used from both:

- frontend status selectors, warnings, and contextual action gating
- backend validation for manual status updates and dependent actions

This record keeps the business rules clarified during implementation so future
changes can preserve the same model without relying on conversation context.

## Original Problem

The current lifecycle rules are spread across several places:

- frontend access hooks
- backend services
- ad hoc status checks in contextual actions
- documentation

This causes drift and ambiguity in areas such as:

- which status options should be selectable
- when a parent blocks a child
- when a child blocks a parent
- when timeframe only warns versus actually blocks
- whether `UsageTracking` has lifecycle status or only metrics

## Core Decisions

### 1. Status ownership

- All entity status changes are manual.
- Backend must never auto-advance lifecycle status for `Promotion`, `Phase`,
  `Reward`, `QualifyCondition`, or `UsageTracking`.
- Tracking recalculation may update:
  - tracking payloads
  - contribution snapshots
  - balances
- Tracking recalculation must not update lifecycle statuses.

### 2. Timeframes

- Timeframes do not auto-change statuses.
- Timeframes do not directly block status changes.
- Timeframes produce warnings when an entity is outside its valid period while
  still in a non-terminal or inconsistent lifecycle state.
- Timeframe warnings must be evaluated for:
  - `Promotion`
  - `Phase`
  - `Reward`
  - `QualifyCondition`
  - `UsageTracking` visibility

### 3. UsageTracking

- `UsageTracking` should not be treated as a lifecycle entity with its own
  domain status.
- The real lifecycle owner is the parent `Reward`.
- `UsageTracking` is a metrics/progress record with timeframe relevance.
- Frontend and backend rules should stop relying on `usageTracking.status` as a
  gating primitive.
- Low-risk rollout:
  - first stop consuming `usageTracking.status` in domain rules
  - later decide whether to physically remove the persisted field

### 4. Selector UX

- Status selectors must show all status options.
- Invalid options must stay visible but disabled.
- Each disabled option must expose all blocking reasons.
- Tooltips or inline helper UI may be used, but the disabled reason must be
  discoverable at selection time.

### 5. Tree consistency

- Parent reopening must validate child states.
- Child advancement must validate parent/child consistency where required.
- Backend rejects invalid combinations.
- Frontend should project the same rules before submit.

## Confirmed Business Rules

## Promotion rules

### Promotion structure editing

- Promotion structure is editable only while the promotion is in an open
  structural state.
- Closed promotion states freeze structural editing of the promotion graph.

### Promotion manual status changes

- `Promotion -> NOT_STARTED`
  - allowed only if the full subtree is reset to a coherent initial state
  - no phase may already be beyond `NOT_STARTED`
- `Promotion -> ACTIVE`
  - allowed if at least one phase is still open (`NOT_STARTED` or `ACTIVE`)
- `Promotion -> COMPLETED`
  - allowed only if no phase remains open (`NOT_STARTED` or `ACTIVE`)
- `Promotion -> EXPIRED`
  - allowed only if no phase remains open (`NOT_STARTED` or `ACTIVE`)

### Promotion timeframe warnings

- If promotion timeframe has passed and status is still non-terminal, show a
  warning.
- Warning does not auto-change status.

## Phase rules

### Phase structure editing

- Phase structure is editable only while the phase is structurally open.
- If the parent promotion is structurally closed, phase structure is also
  closed.

### Phase manual status changes

- `Phase -> NOT_STARTED`
  - allowed only if all child rewards are back in their initial coherent state
  - reward subtree must be consistent with a non-started phase
  - concretely, all rewards must be `QUALIFYING`
  - and all qualify conditions below them must be `PENDING`
- `Phase -> ACTIVE`
  - allowed if at least one child reward remains open
- `Phase -> COMPLETED`
  - allowed only if no child reward remains open
- `Phase -> EXPIRED`
  - allowed only if no child reward remains open

### Open reward states for phase validation

For phase consistency, the following reward states are treated as open:

- `QUALIFYING`
- `PENDING_TO_CLAIM`
- `CLAIMED`
- `RECEIVED`
- `IN_USE`

### Phase timeframe warnings

- If phase timeframe has passed and phase status is still non-terminal, show a
  warning.
- Warning does not auto-change status.

## Reward rules

### Reward structure editing

- Reward definition, usage conditions, and qualify condition composition are
  editable only while reward status is `QUALIFYING`.
- Parent structural closure also locks reward structure.

### Reward manual status changes

- Reward status remains manually editable.
- Reverting backwards is allowed if the resulting tree stays consistent.

#### Reward -> QUALIFYING

Allowed only if:

- parent promotion is in an open coherent state
- parent phase is in an open coherent state
- all child qualify conditions are `PENDING` or `QUALIFYING`

#### Reward -> PENDING_TO_CLAIM

Allowed only if:

- all child qualify conditions are `FULFILLED`
- claim method is manual

#### Reward -> CLAIMED

Allowed only if:

- all child qualify conditions are `FULFILLED`
- claim method is manual

#### Reward -> RECEIVED

Allowed only if:

- all child qualify conditions are `FULFILLED`

#### Reward -> IN_USE

Allowed only if:

- all child qualify conditions are `FULFILLED`

#### Reward -> USED

Allowed only if:

- all child qualify conditions are `FULFILLED`

#### Reward -> EXPIRED

- manual
- not automatic
- may be selected whenever the resulting tree remains consistent

### Reward parent dependency

- Promotion or phase closure does not automatically force reward terminal state.
- A reward may remain usable after promotion qualification window closes if that
  is consistent with its own usage period and lifecycle.
- This is exactly why parent status must not be used as a blunt proxy for child
  lifecycle.

### Reward warnings

Reward warning set should include:

- reward outside its effective usage timeframe while still non-terminal
- any child qualify condition in `FAILED`
- any child qualify condition in `EXPIRED`
- any other future incoherent parent/child combination discovered by policy

## QualifyCondition rules

### QualifyCondition structure and status editing

- Qualify condition status remains manual.
- While parent reward is `QUALIFYING`, the qualify condition may move freely
  between statuses.
- Reverting backwards is allowed.
- Once the parent reward leaves `QUALIFYING`, the qualify condition is frozen,
  including its status selector.

### QualifyCondition -> PENDING or QUALIFYING

Allowed only if:

- parent reward is `QUALIFYING`
- parent phase is open and coherent
- parent promotion is open and coherent

### QualifyCondition -> FULFILLED, FAILED, or EXPIRED

Allowed only if:

- parent reward is still `QUALIFYING`
- parent phase is open and coherent
- parent promotion is open and coherent

### QualifyCondition terminal semantics

For user-facing warning logic, qualify condition terminality is not only a
matter of raw status.

The system must also account for cases where:

- the condition has retries
- the status is not `FAILED`
- but no retries remain

That means the policy needs a distinction between:

- manual lifecycle status
- derived "can still continue qualifying" warning state

This derived warning state must not overwrite the manual QC status.

### QualifyCondition timeframe warnings

- If QC timeframe has passed and status is still not terminal in business
  terms, show a warning.
- Warning does not auto-change status.

## UsageTracking rules

### Domain role

- `UsageTracking` is not a lifecycle owner.
- It represents progress, usage metrics, and consumption snapshots.

### Gating

Contextual usage actions must be gated by:

- parent reward status
- parent reward type
- parent reward usage conditions
- parent reward / parent tree consistency

Not by `usageTracking.status`.

### Warnings

UsageTracking UI may show warnings such as:

- usage period already passed
- reward still marked usable while usage timeframe is over

These warnings do not block status changes directly.

## Blocking versus warning

## Hard blockers

These must reject on backend and disable on frontend:

- parent/child lifecycle inconsistency
- child subtree incompatible with parent reopening
- reward trying to advance without fulfilled qualify conditions
- qualify condition changing status after parent reward left `QUALIFYING`

## Soft warnings

These must warn but not block by themselves:

- entity outside timeframe but still in a non-terminal state
- reward still `QUALIFYING` while some child QC is `FAILED` or `EXPIRED`
- QC no longer realistically completable due to no retries remaining

## Target Architecture

## Shared domain module

Create a shared pure domain module under `packages/shared/src/domain/lifecycle/`.

Suggested files:

- `types.ts`
- `promotion.ts`
- `phase.ts`
- `reward.ts`
- `qualify-condition.ts`
- `warnings.ts`
- `index.ts`

These files should contain pure functions only.

### Policy output shape

Suggested policy output:

```ts
type PolicyReason = {
  code: string;
  message: string;
};

type StatusOptionPolicy<TStatus extends string> = {
  value: TStatus;
  enabled: boolean;
  reasons: PolicyReason[];
};

type LifecyclePolicy<TStatus extends string> = {
  canEditStructure: boolean;
  canEditStatus: boolean;
  statusOptions: StatusOptionPolicy<TStatus>[];
  warnings: PolicyReason[];
  actions: {
    canLaunchBetEntry?: boolean;
    canLaunchDepositEntry?: boolean;
    reasons?: PolicyReason[];
  };
};
```

The exact shape may evolve, but the important part is:

- shared
- pure
- detailed enough for frontend and backend

## Frontend integration

Frontend hooks should become thin adapters over shared policy:

- `useRewardAccessLogic`
- `useQualifyConditionAccessLogic`
- later, promotion/phase access hooks if needed

Frontend work items:

- feed shared policy inputs from current page/form context
- disable invalid status options instead of filtering them out
- show all reasons for each disabled option
- render warnings from policy
- stop using `usageTracking.status` as a gating primitive

## Backend integration

Backend services should use the same shared policy:

- `promotion.service.ts`
- `reward.service.ts`
- `qualify-condition.service.ts`
- relevant contextual gating in `bet.service.ts` and `deposit.service.ts`

Backend work items:

- validate manual status changes against policy
- validate parent reopening against child tree state
- reject invalid transitions with the same reasons exposed to frontend
- stop using `usageTracking.status` as a lifecycle gate

## Refactor Phases

## Phase 0. Freeze and align terminology

- [x] Keep `tracking.service` limited to metrics, tracking payloads, and balances
- [x] Stop referring to tracking recalculation as automatic lifecycle updates
- [x] Keep `promotion-logic.md` aligned with the manual-status model

## Phase 1. Shared lifecycle policy for Reward and QualifyCondition

- [x] Create shared policy types in `packages/shared/src/domain/lifecycle`
- [x] Implement reward policy
- [x] Implement qualify condition policy
- [x] Export policy helpers from shared public API
- [x] Add warning helpers for failed/expired child conditions and timeframe drift

## Phase 2. Frontend adoption for Reward and QualifyCondition

- [x] Replace duplicated logic in `useRewardAccessLogic`
- [x] Replace duplicated logic in `useQualifyConditionAccessLogic`
- [x] Update status selectors to show all options but disable invalid ones
- [x] Surface all blocking reasons in UI
- [x] Surface timeframe and child-state warnings in UI
- [x] Stop relying on `usageTracking.status` in reward gating

## Phase 3. Backend adoption for Reward and QualifyCondition

- [x] Validate reward status changes through shared policy
- [x] Validate qualify condition status changes through shared policy
- [x] Keep existing structural-edit locks but derive them from the same policy
- [x] Reject invalid parent/child combinations with explicit messages

## Phase 4. Shared lifecycle policy for Promotion and Phase

- [x] Implement promotion policy
- [x] Implement phase policy
- [x] Validate reopening logic (`NOT_STARTED`, `ACTIVE`) against descendants
- [x] Validate terminalization logic (`COMPLETED`, `EXPIRED`) against descendants

## Phase 5. Frontend and backend adoption for Promotion and Phase

- [x] Project the same policy in promotion and phase forms
- [x] Disable invalid status options with full reasons
- [x] Show timeframe warnings without auto-mutating state
- [x] Enforce the same rules on backend mutation paths

## Phase 6. UsageTracking de-lifecycle

- [x] Remove `usageTracking.status` from frontend gating
- [x] Remove `usageTracking.status` from backend gating
- [x] Keep usage tracking as metrics + progress only
- [x] Decide whether the persisted field stays temporarily for compatibility
- [x] Remove the persisted database field and related indexes

Current schema decision:

- `usageTracking.status` has been removed from shared schemas, backend rules,
  Prisma schema, and the development database
- shared schemas and UI no longer treat usage tracking as a lifecycle owner
- tracking payloads (`usageData`) are metrics-only and no longer persist a
  derived `status`

## Deferred Validation Checklist

These checks are not an implementation blocker. They should become tests when
the project resumes formal test coverage.

- [ ] A reward cannot move to `PENDING_TO_CLAIM`, `CLAIMED`, `RECEIVED`, `IN_USE`, or `USED` unless all child QCs are `FULFILLED`
- [ ] A QC cannot change status once its parent reward is no longer `QUALIFYING`
- [ ] Promotion `NOT_STARTED` is rejected if any child phase is not `NOT_STARTED`
- [ ] Phase `NOT_STARTED` is rejected if any child reward is not `QUALIFYING`
- [ ] Phase `NOT_STARTED` is rejected if any grandchild QC is not `PENDING`
- [ ] Promotion `ACTIVE` is allowed when at least one phase remains open
- [ ] Promotion `COMPLETED` or `EXPIRED` is rejected while any phase remains open
- [ ] Phase `COMPLETED` or `EXPIRED` is rejected while any reward remains open
- [ ] Timeframe drift only warns; it does not auto-change lifecycle status
- [x] Reward contextual usage no longer depends on `usageTracking.status`

## Deferred Items

- Unified UI pattern for rendering multiple disabled-option reasons in selects
- Derived warning rule for "no retries left" beyond BET qualify conditions
- Whether promotion/phase forms should render warning summaries at header level,
  section level, or both
- Whether lifecycle timestamps on `RewardUsageTracking` should also be reduced
  later if they no longer add operational value

## References

- `docs/promotion-logic.md`
- `apps/frontend/src/hooks/domain/rewards/useRewardAccessLogic.ts`
- `apps/frontend/src/hooks/domain/qualifyConditions/useQualifyConditionAccessLogic.ts`
- `apps/backend/src/services/reward.service.ts`
- `apps/backend/src/services/qualify-condition.service.ts`
- `apps/backend/src/services/promotion.service.ts`
- `apps/backend/src/services/tracking.service.ts`
