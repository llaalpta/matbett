# Promotion/Reward/Qualify - Post Analysis Checklist

Date: 2026-02-28
Owner: project-local (prototype phase)

## 1) Data Model and Contracts

- [x] Remove `dependsOnQualifyConditionId` from shared schemas.
- [x] Remove `dependsOnQualifyConditionId` from frontend form logic.
- [x] Remove `dependsOnQualifyConditionId` from backend services/transformers.
- [x] Drop DB column `reward_qualify_conditions.dependsOnQualifyConditionId`.
- [x] Keep `otherRestrictions` only in `conditions.otherRestrictions`.

## 2) Backend Behavior

- [x] Promotion update deletion guards aligned with current model.
- [x] Reward update/delete guards aligned with current model.
- [x] Qualify condition delete guards aligned with current model.
- [x] Endpoints for standalone reward and standalone qualify condition available.

## 3) Frontend Behavior

- [x] Reward form uses nested qualify condition restrictions paths.
- [x] Standalone qualify condition form aligned with shared schema.
- [x] Relative-timeframe dependency notice extracted to reusable timeframe-level hook.
- [x] Dependency notice available to all entities that use `TimeframeForm`.

## 4) Validation and Tooling

- [x] `shared` build and lint pass.
- [x] `api` build and lint pass.
- [x] `backend` TypeScript and lint pass.
- [x] `frontend` TypeScript and lint pass.
- [x] Prisma migrations deployed in local development DB.

## 5) UX Feedback Consistency

- [x] API error and success feedback split into dedicated hooks (`useApiErrorMessage` + `useApiSuccessToast`).
- [x] Form validation invalid-submit focus extracted (`useFormInvalidSubmitFocus`).
- [x] Reusable dismissible error banners (`ApiErrorBanner` + `ValidationErrorBanner`).
- [x] Reusable load/query error state (`CenteredErrorState`).
- [x] Applied to promotion/deposit/qualify/reward frontend flows.

## 6) Pending for Next Milestone (Tracking)

- [ ] Implement qualify condition fulfillment tracking with real events.
- [ ] Implement reward usage tracking with real events.
- [ ] Complete bet registration flow end-to-end (UI + API + linkage).
- [ ] Define acceptance tests for tracking transitions and timestamps.

## Notes

- This checklist tracks implementation progress, not deployment readiness.
- For current prototype objective (structure without tracking), core items are closed.
