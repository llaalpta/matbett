# Frontend (apps/frontend)

Next.js 15 application for promotion management and betting analysis.

## Purpose

Provides UI flows for promotions, rewards, qualify conditions, deposits, and analytics panels while consuming the tRPC contract from `@matbett/api`.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS
- React Hook Form + Zod resolver
- TanStack Query + tRPC client

## Run

```bash
pnpm dev
```

Default URL: `http://localhost:3000`.

## Key Structure

- `src/app`: routes/pages.
- `src/components`: UI layer (atoms/molecules/organisms).
- `src/hooks`: domain hooks, API hooks, form hooks.
- `src/lib/trpc.ts`: typed API client.
- `src/utils`: generic client-side helpers reused across features.

## Frontend Conventions

- Read this file and the linked docs before implementing frontend changes.
- Read `../../docs/frontend-visual-direction.md` before changing frontend visual structure or styling.
- Use schemas from `@matbett/shared`; do not redefine domain validation locally.
- Use `RouterInputs`/`RouterOutputs` for API typing.
- Keep domain logic in hooks; keep components render-focused.
- Keep feature-specific pure helpers inside the relevant domain hook file; reserve `src/utils` for cross-feature helpers only.
- Keep API errors and validation feedback separated in UI.
- Group domain hooks by feature under `src/hooks/domain/<domain>`.
- Keep `src/hooks` limited to hooks; do not leave feature-specific non-hook helper files there.
- Prefer a form shell that creates the RHF instance and a separate content component that consumes `FormProvider`.
- Prefer extracting large UI sections into feature folders before introducing wrapper hooks/components.
- Avoid wrapper hooks that only expose pure functions; either inline those helpers in the real hook or move them to `src/utils` if they are cross-feature.
- Prefer explicit event handlers over `useEffect` when the change originates from a direct user action.
- Reserve `useEffect` for watched-field synchronization, async side effects, and derived write-backs.

## Visual Direction

- Build operational UIs first: readable, trustworthy, compact enough for efficient use.
- Prefer strong hierarchy and table-oriented presentation for data-heavy screens.
- Keep forms visually consistent and denser than a marketing-style layout.
- Use status colors consistently and make blocked actions explain themselves.
- Avoid flashy gradients, oversized cards, decorative UI, and excessive whitespace.

## Related Docs

- Root docs index: `../../docs/README.md`
- Promotion persistence logic: `../../docs/promotion-logic.md`
- Feedback standard: `../../docs/frontend-feedback-pattern.md`
- Visual direction: `../../docs/frontend-visual-direction.md`
- UI consolidation plan: `../../docs/ui-consolidation-plan.md`
- Calculation reference: `./docs/matched-betting-calculations.md`
- Exchange capital correction note: `./docs/exchange-capital-correction.md`
