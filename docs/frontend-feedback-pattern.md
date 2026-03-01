# Frontend Feedback Pattern

Date: 2026-02-28

## Goal

Use a single, consistent pattern for user feedback in frontend flows.

## Standard

1. Field validation errors:
- Show with `FormMessage` next to each field.
- Show top-level validation banner with `ValidationErrorBanner`.

2. Submit feedback (create/update/delete):
- Use `useApiErrorMessage` for API error state.
- Use `useApiSuccessToast` for success notifications.
- Render API errors with `ApiErrorBanner` (dismissible).
- Show validation errors and API errors in separate banners above form/modal actions.
- Show success with global toast/snackbar by default (non-blocking).

3. Query/load errors on pages:
- Use `CenteredErrorState`.
- Include `Reintentar` when `refetch` exists.
- Include `Volver` action when navigation fallback is needed.

4. Console output in UI flows:
- Do not rely on `console.error`/`console.warn` for user-visible feedback.

## Reusable Modules

- Hook: `apps/frontend/src/hooks/useApiErrorMessage.ts`
- Hook: `apps/frontend/src/hooks/useApiSuccessToast.ts`
- Hook: `apps/frontend/src/hooks/useFormInvalidSubmitFocus.ts`
- Component: `apps/frontend/src/components/feedback/ErrorBanner.tsx`
- Component: `apps/frontend/src/components/feedback/ValidationErrorBanner.tsx`
- Component: `apps/frontend/src/components/feedback/ApiErrorBanner.tsx`
- Component: `apps/frontend/src/components/feedback/CenteredErrorState.tsx`
- Provider: `apps/frontend/src/components/feedback/ToastProvider.tsx`

## Applied Areas

- Promotion create/edit pages
- Deposit detail page
- Qualify condition list/detail pages
- Reward standalone form
- Qualify condition standalone form
- Deposit modal
- Promotion/deposit list pages
- Placeholder list pages for bets/rewards
- Global app provider wiring:
  - `apps/frontend/src/components/providers/index.tsx`
