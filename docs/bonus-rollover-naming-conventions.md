# Bonus and Rollover Naming Conventions

## Scope

Canonical terminology for code, UI text, and documentation.

## Canonical Terms

- Base reward restrictions:
  - `activationRestrictions`
  - `claimRestrictions`
  - `withdrawalRestrictions`
- Usage conditions:
  - type-specific execution rules (`FREEBET`, `BET_BONUS_ROLLOVER`, etc.)
- Rollover required fields:
  - `multiplier`
  - `expectedLossPercentage`

## UI Wording

- Use "claim" consistently for reward redemption terminology.
- Use "no restriction" semantics when optional limits are empty.
- Avoid mixing policy names and user-facing labels in the same sentence.

## Analysis Status Names

- `incomplete`: missing required inputs.
- `invalid`: contradictory constraints.
- `valid-profitable`: valid config with positive expected value.
- `valid-not-profitable`: valid config with non-positive expected value.
