# Promotion/Reward/Qualify Readiness Audit

Date: 2026-02-28  
Last update: 2026-02-28 (post cleanup + migration deploy)

## Scope

- Promotion registration flow (phases, rewards, qualify conditions, usage conditions).
- Standalone reward edit form.
- Standalone qualify condition edit form.
- Backend readiness (schemas, services, endpoints, delete rules, migrations).

## Executive Summary

- Base model for rewards and qualify conditions is now coherent for the current prototype scope.
- `dependsOnQualifyConditionId` was removed end-to-end (shared schema, frontend, backend services/transformers, Prisma schema + migration).
- `otherRestrictions` is now modeled only inside `conditions.otherRestrictions` for qualify conditions.
- Relative-timeframe dependency notice is now reusable across entities through `TimeframeForm` (not only qualify conditions).
- Frontend error/success feedback is now centralized and reusable across forms/pages.
- Lint and TypeScript checks are green in `shared`, `api`, `backend` and `frontend`.
- DB migrations were applied successfully on local dev DB and Prisma reports schema up-to-date.

## Changes Closed In This Iteration

1. Removed orphan dependency field (`dependsOnQualifyConditionId`)
- Shared schema cleaned.
- Frontend logic cleaned.
- Backend transformers/services cleaned.
- Prisma column dropped with migration:
  - `apps/backend/prisma/migrations/20260228223000_remove_qualify_condition_dependency_column/migration.sql`

2. Simplified qualify condition restrictions model
- `otherRestrictions` is nested only in `conditions` for:
  - `DEPOSIT`
  - `BET`
  - `LOSSES_CASHBACK`
- No extra top-level mapping/resolver branch needed.

3. Unified relative dependency notice
- New generic hook:
  - `apps/frontend/src/hooks/domain/useTimeframeDependencyNotice.ts`
- Integrated in shared timeframe UI:
  - `apps/frontend/src/components/molecules/TimeframeForm.tsx`
- Result: any entity using `TimeframeForm` with relative anchor can show dependency context.

4. Cleanup and consistency
- Removed dead variables/props and obsolete comments in touched files.
- Kept services and transformers aligned with current prototype rules (no hidden legacy behavior).

## Validation Log

- `packages/shared`: `npm run build` + `npm run lint` passed.
- `packages/api`: `npm run build` + `npm run lint` passed.
- `apps/backend`: `npm run ts` + `npm run lint` passed.
- `apps/frontend`: `npm run ts` + `npm run lint` passed.
- `apps/backend`: `npm run prisma:migrate:prod` applied pending migrations.
- `apps/backend`: `prisma migrate status` => `Database schema is up to date`.
- `apps/backend`: `prisma migrate reset --force` executed (clean dev DB rebuild from migrations).
- `apps/backend`: `prisma generate` executed after schema cleanup to refresh Prisma Client.

## Open Functional Gaps (Expected For Next Milestone)

1. No operational tracking yet for:
- qualify condition fulfillment tracking logic.
- reward usage tracking logic tied to real bet/deposit registration.

2. Bets flow still not complete end-to-end for full tracking lifecycle.

3. UX hardening remains (copy/consistency polish), but current behavior is usable for prototype modeling.

## Suggested Next Focus

- Keep current milestone on structure correctness (already in good shape).
- Defer tracking engine implementation to the next milestone with a dedicated plan and acceptance tests.
