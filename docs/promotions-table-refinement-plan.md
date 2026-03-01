# Promotions Table Refinement Record

## Status

Historical refinement record. The main promotions table pass has been
implemented and superseded by `docs/ui-consolidation-plan.md` and
`docs/backlog.md`.

Do not treat old unchecked items from this record as active work unless they are
revalidated against the current code and moved to `docs/backlog.md`.

## Decisions Implemented

- Promotions list is an economic/operational table, not a structural summary.
- Main rows prioritize timeframe, promotion identity, bookmaker account, status,
  rewards count, related bets/deposits, real stake, balance, yield, and actions.
- Description and structural phase/QC summaries are not shown in the main row.
- `Legs` terminology was replaced by `Apuestas realizadas` in Promotions.
- `Stake` in Promotions represents real-money bet stake, not deposits or
  promotional balance usage.
- Expanded rows render a flat rewards table.
- Nested rewards show type, phase, value, status, qualification progress, usage
  progress, stake, balance, yield, and a single action to open the reward.
- Nested rewards do not show a separate `Ver QC` action.

## Remaining Follow-Up

The active follow-up is not another Promotions-only pass. Continue the table
system review in this order:

1. Rewards
2. Qualify Conditions
3. Promotions
4. Bets
5. Deposits

Track new decisions in `docs/backlog.md` or `docs/ui-consolidation-plan.md`.
