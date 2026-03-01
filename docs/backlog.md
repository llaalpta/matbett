# Backlog

## Current Position

MatBett is past the first functional MVP for promotion-linked bet/deposit
tracking. Core registration flows, participation-based persistence, lifecycle
policy, and the first operational table system are in place.

The active project risk is now documentation drift and UI consistency, not the
absence of the core flow.

## Next Milestone

Stabilize the operational UI table system and documentation sources of truth.

Recommended order:

1. Finish documentation cleanup so living docs and historical plans are clearly
   separated.
2. Continue visual/content review of tables with real data:
   - Rewards
   - Qualify Conditions
   - Promotions
   - Bets
   - Deposits
3. Align table content, column order, density, expanded rows, and action
   patterns across those views.
4. Simplify Promotion/Reward/QC detail forms so child entities are managed from
   contextual routes and tables instead of nested macro tabs.
5. Revisit remaining bet calculation scenarios after the table/detail system is
   stable.
6. Add tests after the UI and scenario behavior have settled.

## Active UI Follow-Ups

- Rewards table: review expanded related activity layout and whether usage/QC
  summaries need further compaction.
- Qualify Conditions table: align expanded related bets/deposits with Rewards.
- Promotions table: validate economic columns and nested rewards with more real
  scenarios.
- Bets and Deposits tables: keep visual density and action patterns aligned with
  the final table rules.
- Table primitives: keep `DataTable`, `StatusBadge`, `FilterBar`, empty/loading
  states, and action cells as the canonical UI foundation.
- Detail forms: move toward Promotion -> reward tables, Reward -> QC table, and
  standalone child edit pages. Contextual creation routes now exist for rewards
  from phases and QCs from rewards.

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
- Table read-model regression tests for promotion/reward/QC aggregation.

## Documentation Rule

If a historical plan contains an unchecked item that appears relevant, first
verify it against the current code. If it is still real work, move it into this
backlog before implementing it.
