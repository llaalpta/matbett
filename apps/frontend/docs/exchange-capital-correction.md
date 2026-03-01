# Exchange Capital Calculation Correction

## Problem Statement

The previous exchange-capital estimate was materially unrealistic. It used risk ratios in the 6%-15% range, while real matched-betting execution under common odds ranges required much higher exchange exposure.

## Error Example

Scenario:

- Bonus: `200 EUR`
- Rollover: `x10` (`2000 EUR` total volume)
- Minimum odds: `2.5`

Comparison:

- Previous estimate: `~200 EUR` exchange capital (10% of 2000)
- Corrected estimate: `~3160 EUR` exchange capital (~158% of 2000)

## Corrected Logic

### `calculateExchangeRiskPerEuro`

Calibrated with realistic odds/rating assumptions:

```typescript
if (minOdds <= 1.5) return 0.58;
if (minOdds <= 1.6) return 0.67;
if (minOdds <= 2.0) return 1.08;
if (minOdds <= 2.5) return 1.58;
// higher odds bands use higher risk factors
```

## Mathematical Intuition

Example for a 100 EUR back stake around odds 2.5 vs lay 2.67:

- Lay stake: ~754.72 EUR
- Liability: ~1260.38 EUR
- Risk ratio: ~1.575 EUR risk per 1 EUR back stake

## Verified Examples

### Small Bonus

- Bonus: 50 EUR
- Rollover: x5 = 250 EUR
- Min odds: 2.0
- Exchange capital: `250 * 1.08 = 270 EUR`
- Total capital: `50 + 270 = 320 EUR`

### Large Bonus

- Bonus: 200 EUR
- Rollover: x10 = 2000 EUR
- Min odds: 2.5
- Exchange capital: `2000 * 1.58 = 3160 EUR`
- Total capital: `200 + 3160 = 3360 EUR`

## UI Impact

The UI now exposes:

- realistic exchange-capital requirement,
- risk-per-euro indicator,
- clearer liquidity warnings.

## Applied Changes

1. Corrected `calculateExchangeRiskPerEuro` calibration.
2. Removed unnecessary extra safety multiplier.
3. Added explicit risk-ratio display in analysis UI.
4. Added documentation examples aligned with corrected math.
