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
- `src/utils`: pure client-side logic (including calculations).

## Frontend Conventions

- Use schemas from `@matbett/shared`; do not redefine domain validation locally.
- Use `RouterInputs`/`RouterOutputs` for API typing.
- Keep domain logic in hooks; keep components render-focused.
- Keep API errors and validation feedback separated in UI.

## Related Docs

- Root docs index: `../../docs/README.md`
- Promotion persistence logic: `../../docs/promotion-logic.md`
- Feedback standard: `../../docs/frontend-feedback-pattern.md`
- Calculation reference: `./docs/matched-betting-calculations.md`
- Exchange capital correction note: `./docs/exchange-capital-correction.md`
