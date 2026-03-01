# Frontend Feedback Pattern

## Scope

Defines the unified UX pattern for form validation errors, API errors, and success notifications.

## Rules

1. Field errors:

- Render with field-level `FormMessage`.
- Keep `displayError` opt-in at atom level.

1. Form-level validation:

- Render `ValidationErrorBanner` above form actions.
- On invalid submit, scroll to first invalid field.
- If no invalid field exists, scroll to validation banner/form start.

1. API errors:

- Store and display a single API error message with `ApiErrorBanner`.
- Clear API error explicitly when user retries or dismisses.

1. Success feedback:

- Use toast notifications only for successful operations.
- Avoid success banners inside forms.

## Reusable Modules

- Hook: `apps/frontend/src/hooks/useApiErrorMessage.ts`
- Hook: `apps/frontend/src/hooks/useApiSuccessToast.ts`
- Hook: `apps/frontend/src/hooks/useFormInvalidSubmitFocus.ts`
- Component: `apps/frontend/src/components/feedback/ValidationErrorBanner.tsx`
- Component: `apps/frontend/src/components/feedback/ApiErrorBanner.tsx`
- Component: `apps/frontend/src/components/feedback/ErrorBanner.tsx`

## Implementation Boundary

Do not mix validation state and API state in one hook.
Keep each concern isolated and composable.
