# Rollover Field-to-Calculation Matrix

## Scope

Maps `BET_BONUS_ROLLOVER` fields to their effect on:

- core economics (EV/ROI),
- operational feasibility,
- recommendation quality.

## Core Economic Inputs

- `reward.value`: base bonus amount.
- `multiplier`: total rollover volume multiplier.
- `expectedLossPercentage`: expected loss over matched volume.
- `depositRequired` (derived from DEPOSIT qualify condition): initial required cash.

## Feasibility Constraints

- `oddsRestriction.minOdds` / `maxOdds`: allowable betting range.
- `stakeRestriction.minStake` / `maxStake`: bet-size feasibility.
- `minBetsRequired`: minimum partition count.
- `maxConversionMultiplier`: underlay viability guard.
- `bonusCanBeUsedForBetting`: underlay eligibility guard.

## Operational/Policy Inputs

- `allowMultipleBets` + `multipleBetCondition.*`
- `returnedBetsCountForRollover`
- `cashoutBetsCountForRollover`
- `countOnlySettledBets`
- `requireResolvedWithinTimeframe`
- `maxConvertibleAmount`

## Current Implementation Notes

- Profitability is currently frontend-driven (informational, non-blocking).
- Missing required economic inputs should produce an explicit incomplete state.
- Contradictory limits should produce an explicit invalid state.
