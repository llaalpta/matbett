# Matbett UI Rules

## Scope

Operational UI rules for the current MatBett product.

These rules are grounded in the existing codebase, shared schemas, routes, and
forms. They define how current entities should be navigated, displayed, edited,
and compared across the app.

Relationship to other docs:

- `docs/frontend-visual-direction.md` defines the visual tone and interaction
  intent.
- `docs/ui-consolidation-plan.md` tracks migration order and implementation
  phases.
- `UI_RULES.md` defines the reusable product UI rules that screens should
  follow.

## Product Tone

The UI must feel:

- operational
- clear
- trustworthy
- dense enough for efficient work
- optimized for scanning statuses, dates, and amounts
- safer than flashy

This is a finance/ops tool. It is not a marketing product.

## Navigation Rules

- Use a stable app shell with a primary navigation area visible on desktop.
- Group related sections visually; do not flatten every section into one row of
  equal links.
- Keep `Promotions`, `Rewards`, and `Qualify Conditions` as independent
  sections, but group them under the same parent area in navigation.
- Show the current section through a clear active state.
- Keep the current section title and primary page actions near the top of the
  content area.
- Prefer page-level navigation and direct links to related records over nested
  modal workflows for large operational forms.
- Use back links sparingly. Prefer stable section routes over ad hoc browser
  back behavior.

## Page Header Rules

- Every page should have a concise operational title.
- Description text should be short and only present when it reduces mistakes or
  clarifies workflow.
- Primary actions belong in the header row when they apply to the whole page.
- Secondary counts, totals, or contextual metadata may sit below the title in a
  compact meta row.
- Do not use oversized hero headers or decorative summary cards.

## Tables

- Tables are the default pattern for operational lists.
- Use card grids only when the primary job is browsing a small set of records,
  not comparing dense values.
- Prefer compact row density over spacious rows once readability is preserved.
- Columns should privilege comparison:
  - identity
  - status
  - dates
  - monetary amounts
  - progress
  - available actions
- Numeric values should be right-aligned.
- Date and time should be separated when the time is operationally relevant.
  For lifecycle/timeframe views, prefer explicit deadline columns such as
  `Inicio`, `Fin`, `Calificación hasta`, and `Uso hasta`.
- Context cells should use one primary line and at most one short secondary
  line.
- Use `font-medium` for the primary datum in a cell and muted `text-xs` for
  secondary context.
- Avoid vertical stacks of multiple secondary lines in table cells unless the
  data would otherwise become ambiguous.
- Status fields should render as semantic badges.
- Empty states must explain the absence of records and provide the primary next
  action if one exists.
- Loading states should preserve the page structure and avoid large blank areas.
- Row-level actions belong in a compact trailing column and should be
  iconographic.
- Disabled actions should remain visible and explain the primary blocking reason
  without long inline prose.
- Expandable subrows are appropriate for related operational records such as
  bets or deposits under a reward, qualify condition, or promotion.
- If an expanded row contains only one related dataset, render the subtable
  directly without wrapping it in an extra card/panel.
- Keep vertical dividers subtle and subject to visual re-evaluation; do not
  turn tables into heavy spreadsheet grids.

## Forms

- Forms should use a shell plus content pattern:
  - the shell creates the RHF form instance and provider
  - content composes sections and domain hooks
- Labels, field sizes, required marks, helper text, and validation placement
  should stay consistent across forms.
- Group related fields into compact sections.
- Place section actions on the same row as the section title when screen width
  allows. Stack vertically only on narrow layouts.
- Disabled or read-only sections must explain why they are locked.
- Use inline derived values and calculation summaries where they reduce errors.
- Keep dangerous actions visually distinct from normal submit actions.
- Prefer explicit confirmations for destructive actions, not for normal save.

## Cards vs Tables vs Detail Rows

- Use tables for lists and review workflows.
- Use cards only for:
  - grouping a bounded set of related controls
  - displaying compact contextual summaries
  - isolated empty-state or feedback surfaces
- Use detail rows or compact info grids for read-only record metadata inside
  detail/edit pages.
- Do not solve table-shaped problems with large padded cards.

## Typography

- Favor a restrained product hierarchy:
  - page title
  - section title
  - table/header labels
  - helper text
- Keep dense operational text at predictable sizes.
- Do not use oversized typography that weakens information hierarchy.
- Use muted text only for secondary context, never for important values.

## Spacing

- Prefer compact spacing with clear grouping.
- Avoid large empty vertical gaps between operational sections.
- Use borders and spacing to separate regions instead of oversized cards.
- Table density should favor efficient scanning over decorative breathing room.

## Semantic Color Rules

- Green: successful or completed outcomes
  - `COMPLETED`
  - `FULFILLED`
  - `USED`
  - `WON`
- Amber: pending, qualifying, or work in progress
  - `PENDING`
  - `QUALIFYING`
  - `PENDING_TO_CLAIM`
  - `CLAIMED`
- Blue: active informational states
  - `ACTIVE`
  - `RECEIVED`
  - `IN_USE`
  - neutral zero values in calculation summaries
- Red: failed, expired, destructive, or blocking
  - `FAILED`
  - `EXPIRED`
  - `LOST`
  - destructive actions
- Gray: inactive or structurally unavailable
  - `NOT_STARTED`
  - disabled, archived, or non-actionable states

Keep these meanings stable across entities.

## Feedback States

- Show validation errors near the form and, where needed, in a summary banner.
- Show API errors separately from validation errors.
- Explain why blocked actions are unavailable near the blocked area.
- Use warnings for real inconsistencies, not for routine guidance.
- Avoid duplicate instructional copy.

## Domain Presentation Rules

- `Bets`:
  - default list shape is a flat table of registered legs
  - emphasize placed date, promotional context, reward role, status, stake,
    odds, bookmaker account, settled balance, and actions
  - theoretical profit, risk, and yield belong in batch/detail review unless
    specifically needed for the flat list
  - aggregated batch review lives in `/bets/batches`
- `Qualify Conditions`:
  - list should prioritize timeframe, parent promotion/reward, condition type,
    condition details, status, progress, related records, and contextual actions
- `Rewards`:
  - list should prioritize parent promotion/phase, type, state, value,
    qualification deadline/progress, usage deadline/progress, balance, and
    expandable related records
- `Promotions`:
  - list should prioritize timeframe, name, bookmaker account, status, reward
    count, related bets/deposits, real stake, balance, yield, and expandable
    rewards
- Detail routes are primarily edit surfaces, not browsing surfaces. Browsing
  should happen in lists/tables first.

## Implementation Rules

- Reuse existing shared schemas, routes, and terminology.
- Prefer refactoring existing components over introducing parallel component
  systems.
- Keep generic UI primitives in `apps/frontend/src/components/ui`.
- Keep feature-specific render composition in feature folders under
  `apps/frontend/src/components`.
- Keep reusable table, page header, status, and state components generic and
  sober.
- When a better operational pattern is introduced, reuse it instead of creating
  one more screen-specific variant.
