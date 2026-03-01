# UI Consolidation Plan

## Scope

This document tracks the current state of the MatBett operational UI
consolidation.

Related documents:

- `docs/frontend-visual-direction.md`: visual and interaction tone.
- `UI_RULES.md`: canonical UI rules and display patterns.
- `docs/backlog.md`: current next work queue.

## Current State

The foundational consolidation work has been implemented:

- grouped app navigation with Promotions, Rewards, and Qualify Conditions as
  independent sections under the same operational area
- reusable page header, table, filter, status, empty, loading, and detail
  primitives
- `/bets` migrated to a flat operational bets table
- `/bets/batches` preserved as the aggregate batch view
- `/qualify-conditions` migrated to a table with contextual tracking actions
  and expandable related activity
- `/rewards` migrated to a table with qualification and usage columns plus
  expandable related bets/deposits
- `/promotions` migrated to an economic/operational table with expandable
  rewards
- `/deposits` migrated to the shared table pattern
- contextual creation has started for the detail refactor:
  `/rewards/new/from-phase/[phaseId]` creates rewards inside an existing phase,
  and `/qualify-conditions/new/from-reward/[rewardId]` creates QCs inside an
  existing reward

## Confirmed Product Decisions

- MatBett should feel like a professional finance/ops tool, not a marketing UI.
- Tables are the default pattern for operational datasets.
- Detail routes are primarily edit surfaces; review and comparison happen in
  tables first.
- Rewards and Qualify Conditions are independent sections, but navigation groups
  them under Promotions.
- Bets means registered bet legs by default. Batch review belongs in
  `/bets/batches`.
- Expanded rows should show related operational records, not duplicate the
  parent form.

## Completed Phases

- Phase 1: documentation, grouped navigation, page header, and state primitives.
- Phase 2: reusable `DataTable` with sorting, pagination, loading/empty states,
  actions, and expandable rows.
- Phase 3: Bets flat table and batch table split.
- Phase 4: Qualify Conditions table and related activity expansion.
- Phase 5: Rewards table and related bets/deposits expansion.
- Phase 6: Promotions table with economic columns and nested rewards.

## Remaining UI Work

Continue with a consistency pass, not a redesign:

1. Review Rewards with real data:
   - qualification columns stay adjacent
   - usage columns stay adjacent
   - expanded activity uses the same nested table style as QC and Promotions
2. Review Qualify Conditions:
   - compact progress wording
   - consistent disabled contextual actions
   - expanded bets/deposits aligned with Rewards
3. Review Promotions:
   - confirm `Stake`, `Balance`, `Yield`, `Apuestas realizadas`, and `Depósitos`
     semantics with more fixtures
   - keep nested rewards compact and visually subordinate
4. Review Bets and Deposits:
   - align date/time, status, action, amount, and context cells with the final
     table rules
5. Finalize table density:
   - compact row padding
   - subtle vertical dividers
   - no unnecessary nested card containers
   - ellipsis for long text
   - icon-only actions with clear tooltips

## Current Next Step

Continue the detail/form simplification started by the contextual creation
routes:

1. Replace nested reward/QC editing inside Promotion detail with phase blocks and
   reward tables plus `Añadir reward`.
2. Replace nested QC editing inside Reward detail with a QC table plus
   `Añadir qualify condition`.
3. Keep standalone Reward and QC pages as the editing/detail surfaces.
4. Preserve the fast creation path: new promotion creates one phase and one
   default Freebet reward, but QCs are added contextually after persistence.

## Notes

- Keep business logic intact.
- Use shared schemas and backend read models as the source of truth.
- Do not introduce grouped reporting views until the base table system is
  stable.
- If a historical plan disagrees with this document, verify against code and
  update `docs/backlog.md` before implementing.
