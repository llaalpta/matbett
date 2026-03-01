# Refactor Plan: Promotion > Phase > Reward > QualifyCondition

## Goal
Separate responsibilities clearly:
- `useEntityForm`: React Hook Form setup/lifecycle.
- `useEntityLogic`: domain data rules and handlers.
- Component: rendering + UI state only.

---

## Global Rules

- [x] `useEntityForm` owns: `useForm`, resolver, defaults, rehydrate/reset on `initialData` changes, submit helpers.
- [x] `useEntityLogic` owns: business rules, cross-field sync, data handlers.
- [x] Components own: tabs, modals, selected index, display-only state.
- [x] No domain logic in JSX components.
- [x] No visual/UI state in logic hooks.
- [x] Parent passes only child `basePath`; child builds its internal paths.
- [x] Each entity/module owns its path builder(s) (no global mega-factory).

### Effect Policy (agreed)

- [x] Prefer `handler-first` updates (`onValueChange` / explicit actions) for deterministic cascades.
- [x] Keep `useEffect` only as `guard-rail` reconciliation for async/external changes (catalog loads, reset/rehydrate, serverDates).
- [x] Avoid double writes (`field.onChange` + extra `setValue` for the same field in the same interaction).

---

## 1) Promotion Layer

### Files
- `apps/frontend/src/hooks/usePromotionForm.ts`
- `apps/frontend/src/hooks/domain/usePromotionLogic.ts`
- `apps/frontend/src/components/organisms/PromotionForm.tsx`

### Checklist
- [x] Move rehydration/reset by `initialData` into `usePromotionForm`.
- [x] Keep `usePromotionLogic` limited to promotion/phase domain logic:
  - [x] cardinality SINGLE/MULTIPLE behavior
  - [x] sync root fields -> `phases[0]` in SINGLE
  - [x] phase array operations
- [x] Keep submit normalization in form layer (`usePromotionForm`) via helper.
- [x] Keep `PromotionForm` as orchestrator + UI state only.

---

## 2) Phase Layer

### File
- `apps/frontend/src/components/molecules/PhaseForm.tsx`

### Checklist
- [x] Decide if `usePhaseLogic` is needed (optional extraction).
- [x] If extracted, move reward array operations/handlers there.
- [x] Keep `PhaseForm` as rendering + tab UI state.
- [x] Keep reward tab selection in component; expose only data helpers from `usePhaseLogic`.

---

## 3) Reward Layer

### Files
- `apps/frontend/src/hooks/useRewardForm.ts`
- `apps/frontend/src/hooks/domain/useRewardLogic.ts`
- `apps/frontend/src/components/molecules/RewardForm.tsx`
- `apps/frontend/src/components/organisms/RewardStandaloneForm.tsx`

### Checklist
- [x] Move rehydration/reset by `initialData` into `useRewardForm`.
- [x] Remove reset side-effects from wrappers/components when redundant.
- [x] Keep `useRewardLogic` domain-only (types/valueType/qualifyConditions rules).
- [x] Keep `RewardForm` as unique reward form implementation in both contexts.
- [x] Keep `RewardStandaloneForm` as thin container (data load + provider + submit).

---

## 4) QualifyCondition Layer

### Files
- `apps/frontend/src/hooks/domain/useQualifyConditionLogic.ts`
- `apps/frontend/src/components/molecules/QualifyConditionForm.tsx`
- `apps/frontend/src/hooks/domain/useQualifyConditionStandaloneLogic.ts`
- `apps/frontend/src/components/organisms/QualifyConditionStandaloneForm.tsx`

### Checklist
- [x] Keep QC rules in `useQualifyConditionLogic`.
- [x] Improve typing of paths progressively (without assertions).
- [x] Keep `QualifyConditionForm` rendering-focused.
- [x] Move standalone QC anchor/data preparation to `useQualifyConditionStandaloneLogic`.

---

## 5) Timeframe Layer

### Files
- `apps/frontend/src/hooks/domain/useTimeframeFormLogic.ts`
- `apps/frontend/src/components/molecules/TimeframeForm.tsx`

### Checklist
- [x] Keep current stable split (logic hook + presentational form).
- [x] Expose reusable dependency notice for relative anchors at timeframe level.
- [ ] Optional: strengthen path typing incrementally without reintroducing casts.

---

## 6) Cross-cutting: Status Date Sync

### File
- `apps/frontend/src/hooks/useStatusDateSync.ts`

### Checklist
- [x] Keep sync hooks separate from entity logic hooks.
- [x] Verify each form uses only the relevant sync hook.

---

## 7) Paths Builder Standardization

### Goal
Eliminate path duplication and enforce a consistent pattern across entities.

### Rules
- [x] Entity builds its own internal paths from `basePath`.
- [x] Parent only passes `basePath` to child entity forms.
- [x] Keep one builder module per entity (e.g. reward, qualifyCondition, usageConditions).
- [x] Use constants for static paths and small functions for indexed/dynamic paths.

### Checklist
- [x] Create `reward` path builder module and migrate `RewardForm` + standalone usage.
- [x] Create `qualifyCondition` path builder module; stop building QC leaf paths in `RewardForm`.
- [x] Create `usageConditions` path builder module; remove duplicated `usagePaths` declarations.
- [x] Align `Timeframe` path usage with the same basePath-driven pattern.
- [x] Remove duplicated path blocks from `RewardForm.tsx` and verify readability improvements.

---

## Execution Order

1. [x] Promotion layer lifecycle (`usePromotionForm` rehydrate/reset).
2. [x] Phase layer alignment (`usePhaseLogic` extraction decision).
3. [x] Reward layer lifecycle + wrapper cleanup (`useRewardForm` rehydrate/reset).
4. [x] Reward logic API cleanup (`useRewardLogic` surface simplification).
5. [x] QualifyCondition logic typing improvements.
6. [x] Paths builder standardization (per-entity modules, basePath-driven).
7. [x] Final project checks (`eslint` + `tsc`) for full frontend/backend scope.

---

## Validation after each step

- [x] Run ESLint on touched files only.
- [x] Run TypeScript check for frontend after each completed step.

## Notes

- Frontend full `eslint` run is currently blocked by pre-existing repo-wide issues outside this refactor scope.
- Frontend full `tsc` is passing again after restoring workspace package builds (`@matbett/shared` / `@matbett/api`) and reward-logic typing cleanup.
- Touched-file `eslint` + frontend `tsc --noEmit` are passing after each refactor step.
- This plan is now governed by `docs/timeframe-refactor-no-legacy-plan.md` for timeframe/anchors/temp-id architecture.

## Pending follow-ups (agreed)

- [x] `useRewardLogic` switched to self-contained API (no external setters/callback injection).
- [x] Changing reward type now rebuilds reward defaults while preserving existing QC associations/config.
- [x] Mirror the same self-contained pattern in `usePromotionLogic` and remaining entity logic hooks.
- [ ] Optional: incremental cleanup of text encoding/copy quality in form labels/tooltips.
