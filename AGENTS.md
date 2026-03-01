# Project Conventions

## Scope

Repository-level rules for frontend form architecture and bet registration UX.

## Bet Registration

- Treat `docs/bet-registration-implementation-plan.md` as the functional source of truth.
- Prefer scenario-specific UI layouts over exposing raw persistence structure when the generic model harms usability.
- Keep payload/model consistency with shared schemas even when the UI is scenario-specific.

## Backend Services

- Before implementing backend changes, read `apps/backend/README.md` and any backend docs it references.
- Keep backend structure aligned with `router -> service -> repository/transformer`.
- Keep shared-schema parsing at service boundaries; do not duplicate domain validation ad hoc in routers.
- Validate ownership and identifier consistency before applying update diffs.
- Keep one business operation inside one transaction scope.
- Prefer extracting repeated sub-workflows into private service methods before letting a service method grow through copy/paste loops.
- Prefer repositories for persistence access patterns and transformers for DTO/Prisma mapping; do not move business decisions into transformers.
- When refactoring a large service, prefer smaller cohesive helpers over introducing extra abstraction layers without a clear domain boundary.

## Frontend Forms

- Before implementing frontend changes, read `apps/frontend/README.md` plus the relevant frontend docs referenced there.
- Read `docs/frontend-visual-direction.md` before changing frontend UI structure or styling.
- Use React Hook Form with small composition hooks.
- Keep form setup in dedicated hooks such as `use*Form`.
- Keep domain logic in focused hooks such as `use*Logic` or `use*Calculation`.
- Keep calculation formulas in pure helper functions, not inline in JSX.
- When a derived field becomes manually editable, reset the manual override when any upstream driver changes.
- Group domain hooks by feature under `apps/frontend/src/hooks/domain/<domain>`.
- Keep `hooks` directories limited to hook files. Do not create `form.ts`, `layout.ts`, `catalog.ts`, or similar non-hook files inside `hooks`.
- If a pure helper is specific to one domain hook, keep it inside that hook file.
- Only place helpers in `apps/frontend/src/utils` when they are genuinely cross-feature and reusable outside the current form/domain.
- Prefer a larger cohesive domain hook over a set of thin wrapper hooks that only return functions.
- Prefer calling the real domain hooks directly from the form content instead of adding orchestration wrappers with no independent responsibility.

## Frontend Implementation Workflow

- Before writing new frontend code, search for reusable atoms, molecules, hooks, and utils in `apps/frontend/src`.
- Reuse existing shared utilities (for example formatters, field helpers, and API hooks) before creating new local helpers inside a component file.
- Decide the file location by responsibility:
  - generic rendering primitives in `components/atoms` or `components/ui`
  - feature-specific composed UI in feature folders such as `components/molecules/bets`
  - form/domain behavior in `hooks`
  - cross-feature calculations, formatting, and value helpers in `utils`
- Keep feature-specific pure helpers inside the relevant domain hook file instead of creating non-hook files under `hooks`.
- Keep single-use form-specific helpers colocated with the relevant domain hook; reserve `src/utils` for genuinely cross-feature or generic pure helpers.
- Do not let large frontend molecules accumulate unrelated sections. When a form component grows too large or mixes orchestration, tables, cards, and subforms, extract dedicated feature components into their own files.
- For bet registration specifically, prefer feature-scoped extraction under `apps/frontend/src/components/molecules/bets` when sections can be isolated without duplicating state logic.
- Split frontend components by rendering responsibility:
  - form shell creates the RHF instance and `FormProvider`
  - form content wires sections and domain hooks
  - feature sections/cards/tables stay render-focused
- Prefer extracting large sections such as cards, tables, and subforms before extracting tiny wrappers.
- Avoid wrapper components or wrapper hooks that only forward props or return functions without adding meaningful responsibility.
- Prefer event handlers over `useEffect` when a state transition can be handled directly at the interaction point.
- Use `useEffect` only for cross-field synchronization, async side effects, or derived write-backs that depend on watched form state.

## Frontend Visual Direction

- Default to an operational UI tone: clear, dense enough for efficient work, and trustworthy.
- Prefer finance/ops-tool aesthetics over marketing aesthetics.
- Prioritize readability, hierarchy, consistent forms, strong tables, status clarity, safe interactions, and low noise.
- Prefer tables for operational datasets and review workflows; avoid replacing table-shaped problems with oversized cards.
- Keep cards restrained and purposeful; do not introduce decorative surfaces, flashy gradients, or excessive whitespace.
- Keep status colors semantically consistent across the app.
- Make disabled actions and locked sections explain why they are unavailable.

## External Docs

- Use Context7 when the task depends on current third-party library APIs, setup steps, configuration, or code examples.
- Prefer Context7 for repository dependencies such as Next.js, React, React Hook Form, Zod, Prisma, tRPC, TanStack Query, and shadcn/ui.
- Do not use Context7 as a source of truth for MatBett business rules; use the repository code and `docs/bet-registration-implementation-plan.md` for product behavior.
- When the target library is known, go directly by library ID instead of broad search to reduce ambiguity.
- Use Context7 to confirm exact API shapes before introducing or refactoring framework-specific patterns.

## Field UX

- Reuse atom-level `required` support for required field marking and warning states.
- Reuse atom-level `tooltip` support for persistent contextual help instead of inline helper copy when possible.
- For required numeric fields that default to `0`, use component support that treats `0` as empty for visual guidance.

## References

- `apps/frontend/README.md`
- `docs/frontend-form-pattern.md`
- `docs/frontend-feedback-pattern.md`
- `docs/frontend-visual-direction.md`
- `docs/ui-consolidation-plan.md`
- `docs/codex-mcp.md`
