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

- grouped app navigation with promotions, recompensas, and condiciones de calificación as
  independent sections under the same operational area
- reusable page header, table, filter, status, empty, loading, and detail
  primitives
- `/bets` migrated to a flat operational bets table
- `/bets/batches` preserved as the aggregate batch view
- `/bets/new` consolidated as the canonical bet operation form: setup,
  operation bets, contextual promotion assignment, and compact estimated
  calculation output
- `/qualify-conditions` migrated to a table with contextual tracking actions
  and expandable related activity
- `/rewards` migrated to a compact operational table with qualification and
  usage columns; related bets/deposits now live in the reward detail
- `/promotions` migrated to an economic/operational table with expandable
  rewards
- `/deposits` migrated to the shared table pattern
- contextual creation has started for the detail refactor:
  `/rewards/new/from-phase/[phaseId]` creates rewards inside an existing phase,
  and `/qualify-conditions/new/from-reward/[rewardId]` creates conditions inside an
  existing reward
- promotion detail no longer owns nested reward/condition editing; phases render as
  visible blocks and rewards are managed through contextual reward routes
- reward and condition detail pages now use the shared page header,
  compact context blocks, embedded tables, and contextual routes instead of
  large card/list variants

## Confirmed Product Decisions

- MatBett should feel like a professional finance/ops tool, not a marketing UI.
- Tables are the default pattern for operational datasets.
- Detail routes are primarily edit surfaces; review and comparison happen in
  tables first.
- Rewards and Qualify Conditions are independent technical sections, but navigation groups
  them under Promotions.
- User-facing Spanish copy uses `recompensa(s)` for the technical `Reward`
  entity. Code identifiers, schemas, imports, and routes keep `Reward`,
  `rewards`, and `/rewards`.
- User-facing Spanish copy uses `condición(es) de calificación`, `condición`,
  `condiciones`, and `tracking de calificación` for the technical
  `QualifyCondition` / `QUALIFY_TRACKING` model. Code identifiers, schemas,
  imports, routes, and payload names stay technical.
- Bets means registered bet legs by default. Batch review belongs in
  `/bets/batches`.
- Expanded rows should show related operational records, not duplicate the
  parent form.
- Bet registration metrics (`profit`, `risk`, `yield`) are estimated values
  until settlement; real balance is derived later from bet status.
- The bet operation form only shows `Cálculo estimado` when a coverage scenario
  makes the outcome comparison useful.
- Reward detail routes are detail-first: summary, conditions, usage, and
  related activity come before the collapsed edit form.

## Completed Phases

- Phase 1: documentation, grouped navigation, page header, and state primitives.
- Phase 2: reusable `DataTable` with sorting, pagination, loading/empty states,
  actions, and expandable rows.
- Phase 3: Bets flat table and batch table split.
- Phase 4: Conditions table and related activity expansion.
- Phase 5: Rewards table and detail-first reward page with related
  bets/deposits moved out of the list expansion.
- Phase 6: Promotions table with economic columns and nested rewards.
- Phase 7: `/bets/new` operational form density pass, including scenario setup,
  promotion context assignment, readonly estimated metrics, and compact
  estimated outcome summary.

## Remaining UI Work

Continue with a consistency pass, not a redesign:

1. Review Conditions:
   - compact progress wording
   - consistent disabled contextual actions
   - expanded bets/deposits aligned with reward detail activity tables
2. Review Promotions:
   - confirm `Stake`, `Balance`, `Yield`, `Apuestas realizadas`, and `Depósitos`
     semantics with more fixtures
   - keep nested rewards compact and visually subordinate
3. Review Bets and Deposits:
   - align date/time, status, action, amount, and context cells with the final
     table rules
   - keep `/bets/new` as the accepted base pattern unless a real-data review
     exposes concrete usability issues
4. Finalize table density:
   - compact row padding
   - subtle vertical dividers
   - no unnecessary nested card containers
   - ellipsis for long text
   - icon-only actions with clear tooltips

## Current Next Step

Review Conditions next, then continue through the remaining table/detail pass:

1. Condition detail: validate related rewards table and related
   bets/deposits tracking section.
2. Promotion detail: validate phase blocks and embedded rewards tables.
3. Preserve the draft creation path: new promotion creates one empty
   `NOT_STARTED` phase; rewards and conditions are added contextually after
   persistence.

## Notes

- Keep business logic intact.
- Use shared schemas and backend read models as the source of truth.
- Do not introduce grouped reporting views until the base table system is
  stable.
- If a historical plan disagrees with this document, verify against code and
  update `docs/backlog.md` before implementing.
