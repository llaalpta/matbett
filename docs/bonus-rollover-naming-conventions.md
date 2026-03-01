# Naming conventions - Bonus / Rollover

## Scope
This document defines canonical naming for reward configuration and rollover analysis.
Use these terms in frontend labels, backend contracts, and docs.

## Canonical terms
- **Reward restrictions (base reward fields)**:
  - `activationRestrictions`
  - `claimRestrictions`
  - `withdrawalRestrictions`
- **Usage conditions (reward-type specific)**:
  - technical execution of rollover/freebet/cashback/enhanced odds/casino spins
  - does not include base reward restrictions
- **Rollover required fields**:
  - `multiplier`
  - `expectedLossPercentage`
- **Rollover optional-with-meaning fields**:
  - `minOdds`, `maxOdds`, `minStake`, `maxStake`, `minBetsRequired`, `maxConversionMultiplier`
  - when omitted, they mean **no explicit restriction**

## UI wording
- Prefer **"canjeo"** for user-facing claim flow text.
- Keep technical field names in code unchanged (`claimRestrictions`).
- Use **"sin restriccion"** semantics in helper text when optional limits are empty.

## Analysis states
- `incompleto`: missing required inputs for profitability analysis.
- `invalido`: contradictory limits (e.g. odds/stake ranges).
- `valido rentable`: analysis returns positive expected value.
- `valido no rentable`: analysis returns non-positive expected value.
