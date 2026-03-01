# Complete Matched Betting Calculation System Documentation

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Promotion Lifecycle](#promotion-lifecycle)
3. [Hedging Strategies](#hedging-strategies)
4. [Bet Types](#bet-types)
5. [Complete Function Inventory](#complete-function-inventory)
6. [Strategy Selection Use Cases](#strategy-selection-use-cases)
7. [Execution Flows](#execution-flows)
8. [Input Parameters](#input-parameters)
9. [Calculation Differences](#calculation-differences)
10. [Calculated Outputs](#calculated-outputs)
11. [Reference Values](#reference-values)
12. [Practical Examples](#practical-examples)
13. [Function Selection Decision Tree](#function-selection-decision-tree)
14. [Glossary](#glossary)
15. [Best Practices](#best-practices)
16. [Troubleshooting](#troubleshooting)
17. [Additional Resources](#additional-resources)
18. [Changelog](#changelog)

---

## Core Concepts

### Basic Terminology

| Term | Description | Typical Location |
| --- | --- | --- |
| **Back Bet** | Bet FOR an outcome | Promotion bookmaker |
| **Lay Bet** | Bet AGAINST an outcome | Exchange (for example Betfair) |
| **Hedge Bet** | Coverage bet on alternative outcomes | Exchange or other bookmakers |
| **Main Form** | First back bet (promotion activator) | Main bookmaker |
| **Main2 Form** | Second back bet (used in prepayment flows) | Main bookmaker |
| **Hedge1/2/3 Form** | Sequential coverage bets | Exchange/other bookmakers |

### Bet Roles

```typescript
enum HedgeRole {
  MAIN = "MAIN",   // mainForm - initial back bet
  HEDGE1 = "HEDGE1", // hedge1Form - first hedge
  HEDGE2 = "HEDGE2", // hedge2Form - second hedge
  HEDGE3 = "HEDGE3", // hedge3Form - third hedge
}
```

### Global Runtime Objects

```typescript
const mainForm = {
  stake: 0,
  odds: 0,
  commission: 0,
  profit: 0,
  risk: 0,
  winBalance: 0,
};

const main2Form = {
  stake: 0,
  odds: 0,
  commission: 0,
  profit: 0,
  risk: 0,
  winBalance: 0,
};

const hedge1Form = {
  stake: 0,
  odds: 0,
  commission: 0,
  profit: 0,
  risk: 0,
  winBalance: 0,
  unmatched: 0,
  cancelledStake: 0,
};

const hedge2Form = { /* same shape */ };
const hedge3Form = { /* same shape */ };

const freeBet = {
  profitRetained: 0,
  hedge1FormfinalBalance: 0,
  hedge2FormfinalBalance: 0,
  hedge3FormfinalBalance: 0,
};

const combinedMainForm = {
  stake: 0,
  odds: 0,
  commission: 0,
  refundValue: 0,
  refundRatio: 0,
  profit: 0,
  risk: 0,
  winBalance: 0,
  prepayment: false,
};

const line1 = { event: "", market: "", selection: "", odds: 0, status: "pending" };
const line2 = { event: "", market: "", selection: "", odds: 0, status: "pending" };
const line3 = { event: "", market: "", selection: "", odds: 0, status: "pending" };
```

---

## Promotion Lifecycle

### Phase 1: QUALIFY

- Goal: unlock rewards with controlled minimal loss.
- Strategy: matched betting or dutching depending on market access.
- Result: reward unlocked (typical qualifying cost is small and controlled).
- Typical functions: `*_no_promotion()` and `*_generate_freebet()`.

### Phase 2: USE REWARD

- Goal: extract guaranteed or near-guaranteed value from the unlocked reward.
- Strategy: freebet usage or bonus usage hedging.
- Result: positive net return after qualification costs.
- Typical functions: `*_use_freebet()`.

---

## Hedging Strategies

### Matched Betting

- Back bet at promotion bookmaker.
- Lay bet at exchange.
- Typical usage: freebet and reward extraction.
- Strength: high market coverage and liquidity.

### Dutching / Arbitrage

- Back bet across two or more outcomes in different bookmakers.
- Typical usage: when exchange is unavailable or constrained.
- Strength: exchange-independent workflow.

### Strategy Modes

#### STANDARD

- Balanced loss distribution across outcomes.
- Default and safest baseline.

#### UNDERLAY

- Prioritizes reducing loss in the promotion bookmaker side.
- Typical motivation: protect bookmaker account side when promo value is high.

#### OVERLAY

- Prioritizes reducing loss in exchange/hedge side.
- Typical motivation: protect exchange liquidity.

---

## Bet Types

### Simple Bets

Single primary back bet with one hedge (or more in special cases).

Core objects:

- `mainForm`
- `hedge1Form`
- `main2Form` (prepayment only)

### Combined Bets

Combined bets multiply line odds:

```text
CombinedOdds = line1.odds * line2.odds * line3.odds
```

#### Sequential Method

Use when events are not overlapping.

Flow:

1. Place combined bet at bookmaker.
2. Cover line 1.
3. If line 1 wins, cover line 2.
4. If line 2 wins, cover line 3 (if present).

Pros:

- Lower capital exposure at start.
- Natural early-stop behavior if early line loses.

Cons:

- Requires active monitoring.
- Odds can move between steps.

#### Simultaneous Method

Use when lines resolve in overlapping time windows.

Flow:

- Cover all lines immediately.

Pros:

- Lock current odds.
- No staged monitoring required.

Cons:

- Higher immediate capital exposure.

### Prepayment

Prepayment promotions pay under a temporary in-play condition.

Typical pattern:

1. Place `mainForm` + `hedge1Form` qualifying structure.
2. If prepayment trigger occurs, place `main2Form`.
3. Rebalance to lock final outcome.

### Unmatched Scenarios

When exchange stake is only partially matched:

- `matchedStake`: matched amount.
- `cancelledStake`: unmatched returned amount.
- `newOdds`: updated odds used for re-hedging.

Flow:

1. Recompute from matched amount.
2. Apply second hedge with `newOdds`.
3. Rebalance net outcomes.

---

## Complete Function Inventory

This section lists every named calculator currently documented in this module.

### 1) Simple Matched Betting (15 functions)

#### Standard Mode (2-option dutching, 4)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_simple_matched_betting_standard_no_promotion` | None | Base qualifying structure |
| `calculate_simple_matched_betting_standard_use_freebet` | Use freebet | Uses unlocked freebet |
| `calculate_simple_matched_betting_standard_generate_freebet` | Generate freebet | Qualifying flow to earn freebet |
| `calculate_simple_matched_betting_standard_prepayment` | Prepayment | Prepayment-compatible structure |

#### Underlay Mode (4)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_simple_matched_betting_underlay_no_promotion` | None | Underlay profile without promotion |
| `calculate_simple_matched_betting_underlay_use_freebet` | Use freebet | Underlay profile with freebet usage |
| `calculate_simple_matched_betting_underlay_generate_freebet` | Generate freebet | Underlay profile to unlock freebet |
| `calculate_simple_matched_betting_underlay_prepayment` | Prepayment | Underlay profile for prepayment flow |

#### Overlay Mode (4)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_simple_matched_betting_overlay_no_promotion` | None | Overlay profile without promotion |
| `calculate_simple_matched_betting_overlay_use_freebet` | Use freebet | Overlay profile with freebet usage |
| `calculate_simple_matched_betting_overlay_generate_freebet` | Generate freebet | Overlay profile to unlock freebet |
| `calculate_simple_matched_betting_overlay_prepayment` | Prepayment | Overlay profile for prepayment flow |

#### Unmatched Scenarios (3)

| Function | Description |
| --- | --- |
| `calculate_simple_matched_betting_standard_no_promotion_unmatched` | Rebalance unmatched stake without promotion |
| `calculate_simple_matched_betting_standard_use_freebet_unmatched` | Rebalance unmatched stake for freebet usage |
| `calculate_simple_matched_betting_standard_generate_freebet_unmatched` | Rebalance unmatched stake while generating freebet |

### 2) Simple Dutching - 2 Options (10 functions)

#### Standard Mode (4)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_simple_dutching_2_options_standard_no_promotion` | None | Two-outcome dutching baseline |
| `calculate_simple_dutching_2_options_standard_use_freebet` | Use freebet | Two-outcome dutching with freebet |
| `calculate_simple_dutching_2_options_standard_generate_freebet` | Generate freebet | Two-outcome dutching to unlock freebet |
| `calculate_simple_dutching_2_options_standard_prepayment` | Prepayment | Two-outcome dutching prepayment flow |

#### Underlay Mode (3)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_simple_dutching_2_options_underlay_no_promotion` | None | Underlay profile |
| `calculate_simple_dutching_2_options_underlay_use_freebet` | Use freebet | Underlay profile with freebet |
| `calculate_simple_dutching_2_options_underlay_prepayment` | Prepayment | Underlay profile prepayment |

#### Overlay Mode (3)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_simple_dutching_2_options_overlay_no_promotion` | None | Overlay profile |
| `calculate_simple_dutching_2_options_overlay_use_freebet` | Use freebet | Overlay profile with freebet |
| `calculate_simple_dutching_2_options_overlay_prepayment` | Prepayment | Overlay profile prepayment |

### 3) Simple Dutching - 3 Options (4 functions)

#### Standard Mode (3)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_simple_dutching_3_options_standard_no_promotion` | None | Three-outcome dutching baseline |
| `calculate_simple_dutching_3_options_standard_use_freebet` | Use freebet | Three-outcome dutching with freebet |
| `calculate_simple_dutching_3_options_standard_generate_freebet` | Generate freebet | Three-outcome dutching to unlock freebet |

#### Underlay Mode (1)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_simple_dutching_3_options_underlay_no_promotion` | None | Three-outcome underlay baseline |

### 4) Combined 2 Lines - Dutching (3 functions)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_combined_2_lines_dutching_standard_no_promotion` | None | Two-line combined dutching |
| `calculate_combined_2_lines_dutching_standard_use_freebet` | Use freebet | Two-line combined dutching with freebet |
| `calculate_combined_2_lines_dutching_standard_generate_freebet` | Generate freebet | Two-line combined dutching to unlock freebet |

### 5) Combined 2 Lines - Matched Betting (3 functions)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_combined_2_lines_matched_betting_standard_no_promotion` | None | Two-line combined matched betting |
| `calculate_combined_2_lines_matched_betting_standard_use_freebet` | Use freebet | Two-line combined matched with freebet |
| `calculate_combined_2_lines_matched_betting_standard_generate_freebet` | Generate freebet | Two-line combined matched to unlock freebet |

### 6) Combined 3 Lines - Matched Betting (3 functions)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_combined_3_lines_matched_betting_standard_no_promotion` | None | Three-line combined matched baseline |
| `calculate_combined_3_lines_matched_betting_standard_use_freebet` | Use freebet | Three-line combined matched with freebet |
| `calculate_combined_3_lines_matched_betting_standard_generate_freebet` | Generate freebet | Three-line combined matched to unlock freebet |

### 7) Combined 3 Lines - Dutching (3 functions)

| Function | Promotion Context | Description |
| --- | --- | --- |
| `calculate_combined_3_lines_dutching_standard_no_promotion` | None | Three-line combined dutching baseline |
| `calculate_combined_3_lines_dutching_standard_use_freebet` | Use freebet | Three-line combined dutching with freebet |
| `calculate_combined_3_lines_dutching_standard_generate_freebet` | Generate freebet | Three-line combined dutching to unlock freebet |

## Total Calculator Functions

- Explicitly listed named calculator functions: **41**.
- Historical references may mention 44; reconcile that count against source code exports when auditing.

---

## Strategy Selection Use Cases

### When to Use Each Strategy

#### Simple Matched Betting

Use when:

- Exchange is available with acceptable liquidity.
- You want deterministic hedge symmetry.
- You are in qualify or reward-use flow and want direct lay coverage.

#### Simple Dutching

Use when:

- Exchange is unavailable or too illiquid.
- You can cover outcomes across multiple bookmakers.
- You accept operational complexity from multi-book placement.

#### Combined Bets (Selection Criteria)

Use when:

- Promotion terms explicitly require combined/parlay bets.
- You can model line-by-line resolution and staged hedge behavior.

#### Prepayment (Selection Criteria)

Use when:

- Promotion settles early under in-play trigger conditions.
- You support `main2Form` placement logic in time.

### Sequential vs Simultaneous

#### Sequential

Prefer when:

- Event windows are separated.
- You want lower initial capital lock.
- You can actively monitor and execute each stage.

#### Simultaneous

Prefer when:

- Events overlap heavily.
- You prioritize fixed odds over capital efficiency.

### Standard vs Underlay vs Overlay

#### Standard (Mode Selection)

- Default choice for balanced risk profile.

#### Underlay (Mode Selection)

- Favor bookmaker-side protection.

#### Overlay (Mode Selection)

- Favor exchange-side protection.

---

## Execution Flows

### Simple Matched Betting Flow

1. Place `mainForm` (back bet).
2. Calculate and place `hedge1Form` (lay bet).
3. Validate both outcomes produce expected controlled net.
4. If generating freebet, store reward value for phase 2.

### Sequential Combined Flow

1. Place combined bet.
2. Hedge line 1.
3. If line 1 wins, hedge line 2.
4. If line 2 wins, hedge line 3 if present.
5. Settle final net.

### Simultaneous Combined Flow

1. Place combined bet.
2. Place all hedges immediately.
3. Track per-line status only for post-settlement reporting.

### Unmatched Flow

1. Execute baseline matched calculation.
2. Detect partial match.
3. Recompute with `matchedStake`, `cancelledStake`, `newOdds`.
4. Add second hedge for unmatched remainder.

### Detailed Prepayment Flow

1. Compute baseline `mainForm` + `hedge1Form`.
2. Wait for prepayment trigger.
3. Compute `main2Form` with live odds.
4. Rebalance final outcomes.

---

## Input Parameters

### Common Parameters

```typescript
interface CommonParams {
  mainForm: {
    stake: number;
    odds: number;
    commission: number;
  };
  hedge1Form: {
    odds: number;
    commission: number;
  };
}
```

### Type-Specific Parameters

#### Prepayment Functions

```typescript
interface PrepaymentParams extends CommonParams {
  prepayment: boolean;
  main2Form: {
    odds: number;
    commission: number;
  };
}
```

#### Freebet Functions

```typescript
interface FreebetParams extends CommonParams {
  mainForm: {
    refundValue?: number;
    refundRatio?: number;
    risk?: number; // typically 0 in freebet use case
  };
}
```

#### Unmatched Functions

```typescript
interface UnmatchedParams extends CommonParams {
  matchedStake: number;
  cancelledStake: number;
  newOdds: number;
  hedge2Form: {
    odds: number;
    commission: number;
  };
}
```

#### Combined Functions

```typescript
type LineStatus = "won" | "lost" | "pending";

interface CombinedParams extends CommonParams {
  line1Status: LineStatus;
  line2Status: LineStatus;
  line3Status?: LineStatus;
  combinedMainForm: {
    stake: number;
    odds: number;
    commission: number;
    refundValue?: number;
    refundRatio?: number;
  };
}
```

---

## Calculation Differences

### Matched Betting (Exchange)

```typescript
// Lay exposure model
hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
hedge1Form.profit = hedge1Form.stake * hedge1FormCommissionRate;

// Typical lay stake formula
hedge1Form.stake =
  (mainForm.odds * mainForm.stake) /
  (hedge1Form.odds - hedge1Form.commission / 100);
```

### Dutching (Other Bookmakers)

```typescript
// Back-back outcome model
hedge1Form.risk = -hedge1Form.stake;
hedge1Form.profit =
  (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) *
  hedge1FormCommissionRate;
```

### Combined Line Status Logic

```typescript
if (line1Status === "lost") {
  // line 1 fails, combined loses early
} else if (line1Status === "won") {
  if (line2Status === "lost") {
    // line 2 fails
  } else if (line2Status === "won") {
    // continue or settle depending on number of lines
  }
}
```

---

## Calculated Outputs

```typescript
interface CalculatedOutputs {
  mainForm?: BetOutput;
  main2Form?: BetOutput;
  hedge1Form?: BetOutput;
  hedge2Form?: BetOutput;
  hedge3Form?: BetOutput;
  freeBet?: {
    profitRetained: number;
    hedge1FormfinalBalance: number;
    hedge2FormfinalBalance: number;
    hedge3FormfinalBalance: number;
  };
}

interface BetOutput {
  stake: number;
  profit: number;
  risk: number;
  winBalance: number;
}
```

---

## Reference Values

```typescript
const TYPICAL_COMMISSIONS = {
  bookmaker: 0,
  betfair: 2,
  smarkets: 2,
  matchbook: 1.5,
};

const TYPICAL_STAKES = {
  qualifying: 10,
  freebetSmall: 5,
  freebetMedium: 10,
  freebetLarge: 25,
  arbitrage: 100,
};

const TYPICAL_REFUND_RATIOS = {
  sportium: 0.75,
  bet365: 1.0,
  williamHill: 0.8,
};
```

---

## Practical Examples

### Example 1: Simple Matched Betting - Use Freebet

```typescript
mainForm.stake = 10;
mainForm.odds = 2.0;
mainForm.commission = 0;
hedge1Form.odds = 2.1;
hedge1Form.commission = 2;

calculate_simple_matched_betting_standard_use_freebet();

// mainForm.risk = 0
// hedge1Form stake/profit/risk computed automatically
```

### Example 2: Prepayment - Early Trigger Promotion

```typescript
mainForm.stake = 10;
mainForm.odds = 2.2;
hedge1Form.odds = 2.4;
hedge1Form.commission = 2;

calculate_simple_matched_betting_standard_prepayment();

// Later, if prepayment trigger occurs:
main2Form.odds = 1.5;
const prepayment = true;
```

### Example 3: Combined 2 Lines - Sequential

```typescript
line1.odds = 1.5;
line2.odds = 1.5;
combinedMainForm.stake = 10;
combinedMainForm.odds = 2.25;

calculate_combined_2_lines_matched_betting_standard_generate_freebet(
  "pending",
  "pending"
);
```

### Example 4: Simple Dutching 3 Options - Standard

```typescript
mainForm.stake = 20;
mainForm.odds = 2.0;
hedge1Form.odds = 3.5;
hedge2Form.odds = 4.0;

calculate_simple_dutching_3_options_standard_no_promotion();
```

### Example 5: Unmatched Scenario

```typescript
mainForm.stake = 50;
mainForm.odds = 2.0;
hedge1Form.odds = 2.1;
hedge1Form.commission = 2;

calculate_simple_matched_betting_standard_no_promotion();

const matchedStake = 30;
const cancelledStake = 20;
const newOdds = 2.2;

calculate_simple_matched_betting_standard_no_promotion_unmatched(
  matchedStake,
  cancelledStake,
  newOdds
);
```

### Example 6: Combined 3 Lines - Dutching with Freebet

```typescript
line1.odds = 1.8;
line2.odds = 1.6;
line3.odds = 1.5;
combinedMainForm.stake = 20;
combinedMainForm.odds = 4.32;

calculate_combined_3_lines_dutching_standard_use_freebet(
  "pending",
  "pending",
  "pending"
);
```

### Example 7: Underlay Mode - Protect Bookmaker Side

```typescript
mainForm.stake = 10;
mainForm.odds = 2.5;
mainForm.refundValue = 20;
mainForm.refundRatio = 0.75;

hedge1Form.odds = 2.7;
hedge1Form.commission = 2;

calculate_simple_matched_betting_underlay_generate_freebet();
```

### Example 8: Overlay Mode - Protect Exchange Side

```typescript
mainForm.stake = 10;
mainForm.odds = 2.5;
mainForm.refundValue = 20;
mainForm.refundRatio = 0.75;

hedge1Form.odds = 2.7;
hedge1Form.commission = 2;

calculate_simple_matched_betting_overlay_generate_freebet();
```

---

## Function Selection Decision Tree

```text
Do you have exchange access?
|- Yes -> market outcomes?
|   |- 2 outcomes -> Simple Matched Betting
|   `- 3+ outcomes -> Simple Dutching 3 options
`
|- No -> market outcomes?
    |- 2 outcomes -> Simple Dutching 2 options
    `- 3 outcomes -> Simple Dutching 3 options

Is it a combined bet?
|- Yes -> 2 lines or 3 lines -> use combined family
`- No -> use simple family

Promotion context?
|- none -> *_no_promotion
|- use freebet -> *_use_freebet
|- generate freebet -> *_generate_freebet
`- prepayment -> *_prepayment

Risk profile?
|- standard
|- underlay
`- overlay

Partial match happened?
|- yes -> *_unmatched(...)
`- no -> standard selected function
```

---

## Glossary

| Term | Definition |
| --- | --- |
| **SNR** | Stake not returned freebet type |
| **SR** | Stake returned freebet type |
| **Qualifying Bet** | Bet placed to unlock promotion/reward |
| **Commission Rate** | Exchange/venue fee rate |
| **Liability** | Maximum lay-side loss |
| **Matched** | Fully matched exchange bet |
| **Unmatched** | Partially matched exchange bet |
| **Prepayment** | Early payout trigger before final result |
| **Refund Value** | Reward amount granted by promotion |
| **Refund Ratio** | Effective retainable proportion |
| **Win Balance** | Net result when a given bet wins |
| **Risk** | Net result when a given bet loses |

---

## Best Practices

### Bankroll Management

1. Keep exposure limits per workflow.
2. Maintain separated balances by bookmaker/exchange.
3. Keep a safety buffer for unmatched/odds movement.
4. Track every operation for auditability.

### Event Selection

1. Check exchange liquidity before execution.
2. Prefer clear settlement windows for sequential flows.
3. Re-validate odds before each staged hedge.
4. Avoid unstable markets close to event start when possible.

### Execution Discipline

1. Validate stake and odds before placing each bet.
2. Recompute immediately if any key input changes.
3. Capture execution context when troubleshooting (matched amount, new odds, statuses).

### Account Safety

1. Avoid deterministic repetitive behavior patterns.
2. Rotate exposure across venues.
3. Respect promotion terms and limits.

---

## Troubleshooting

### Problem: "My lay bet was not fully matched"

Use the corresponding `*_unmatched(...)` function and provide:

- `matchedStake`
- `cancelledStake`
- `newOdds`

### Problem: "Odds changed after I computed stakes"

Re-run the selected calculator with updated odds before placing additional bets.

### Problem: "I do not know when to use sequential vs simultaneous"

- Use sequential when time-separated lines and active monitoring are possible.
- Use simultaneous when lines overlap heavily or odds locking is priority.

### Problem: "I do not know when to use standard/underlay/overlay"

- Start with standard unless there is a clear account/liquidity constraint.
- Use underlay to protect bookmaker-side outcome.
- Use overlay to protect exchange-side outcome.

### Problem: "What expected return range is reasonable?"

It depends on odds, commission, and promo type. Validate with scenario simulation rather than fixed assumptions.

---

## Additional Resources

- Frontend architecture: `apps/frontend/README.md`
- Promotion persistence model: `docs/promotion-logic.md`
- Rollover field impact: `docs/rollover-field-to-calculation-matrix.md`

---

## Changelog

### Version 1.1 (Current)

- Full English rewrite of this document.
- Kept full functional scope: strategy model, function inventory, flows, parameters, and examples.
- Corrected function inventory count to explicit named functions currently listed.

### Future Roadmap (Documentation)

- Align this reference against source exports automatically (generated inventory section).
- Add per-function I/O examples from real test fixtures.
- Add dedicated section for payout settlement edge-cases.
