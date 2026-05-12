# Backlog

## Current Position

MatBett is past the first functional MVP for promotion-linked bet/deposit
tracking. Core registration flows, participation-based persistence, lifecycle
policy, and the first operational table system are in place.

The `/bets/new` operation form has completed its first UI consolidation pass:
scenario setup is compact, bet legs are the main editing surface, promotion
context is assigned per leg, and estimated calculation is shown only when it
adds decision value.

The `/rewards` pass has also been applied: the list is now a compact index
without related-activity expansion, and `/rewards/[id]` is detail-first with
summary, conditions, usage, related activity, and collapsed definition editing.

The active project risk is now keeping the living documentation and UI
consistency aligned while reviewing the remaining operational views.

## Next Milestone

Stabilize the operational UI table system and documentation sources of truth.

Recommended order:

1. Continue visual/content review of tables with real data:
   - Condiciones de calificación
   - Promotions
   - Bets
   - Deposits
2. Align table content, column order, density, expanded rows, and action
   patterns across those views.
3. Review and refine the simplified Promotion/Reward/condition detail forms with real
   data now that child entities are managed from contextual routes and tables.
4. Revisit remaining bet calculation scenarios after the table/detail system is
   stable.
5. Add tests after the UI and scenario behavior have settled.

## Active UI Follow-Ups

- User-facing terminology is aligned on `recompensa(s)` for the technical
  `Reward` entity; keep `Reward`/`rewards` only in code, schemas, and routes.
- User-facing terminology is aligned on `condición(es) de calificación` for the
  technical `QualifyCondition` entity; keep `QualifyCondition`, `QC`, `QT`, and
  `QUALIFY_TRACKING` only in code, schemas, payloads, routes, or historical
  technical docs.
- Rewards table/detail: accepted baseline for this pass. Continue only if real
  data exposes concrete field/order issues.
- Condiciones table: align expanded related bets/deposits with the reward detail
  activity tables.
- Promotions table: validate economic columns and nested rewards with more real
  scenarios.
- Bets and Deposits tables: keep visual density and action patterns aligned with
  the final table rules.
- Bet operation form: treat `/bets/new` as accepted baseline. `Profit`, `risk`,
  and `yield` are estimated metrics; `Cálculo estimado` only shows possible
  outcomes for coverage scenarios.
- Table primitives: keep `DataTable`, `StatusBadge`, `FilterBar`, empty/loading
  states, and action cells as the canonical UI foundation.
- Detail forms: Promotion now uses phase blocks with reward tables; Reward uses
  standalone editing plus a conditions table; conditions use related rewards and tracking
  sections. Continue refining visual density and actions in those detail views.

## Active Functional Follow-Ups

- Continue remaining matched-betting calculation scenarios only after the current
  table/content pass is accepted.
- Keep lifecycle status changes manual; tracking recalculation updates metrics
  and balances, not lifecycle statuses.
- Keep `UsageTracking` as metrics/progress only, with lifecycle owned by
  `Reward`.
- Validate whether any remaining calculation formulas still depend on legacy
  naming or field-shape assumptions.

## Deferred Tests

Tests are intentionally deferred for now. When resumed, prioritize:

- Lifecycle policy status-transition tests.
- Bet registration batch integration tests.
- Contextual tracking recalculation tests.
- Table read-model regression tests for promotion/reward/condition aggregation.

## Documentation Rule

If a historical plan contains an unchecked item that appears relevant, first
verify it against the current code. If it is still real work, move it into this
backlog before implementing it.
