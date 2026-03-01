# Auditoria: Reward schema vs formulario vs backend

Fecha: 2026-02-23

## Alcance

- Reward base (`RewardSchema`) y sus 6 tipos.
- `usageConditions` por tipo.
- `typeSpecificFields` por tipo.
- Defaults del formulario (`buildDefaultReward`).
- Parse/serialize backend (`reward.transformer`, `reward-shared.transformer`, `promotion.transformer`).

## Resultado ejecutivo

- Estado general: **consistente**.
- No he encontrado campos de `RewardSchema` que queden sin ruta de formulario o sin parseo backend.
- El campo `realMoneyUsageRatio` queda ya integrado en:
  - schema shared
  - defaults
  - paths promotion + standalone
  - formulario de rollover
  - analisis de rentabilidad
  - parseo backend (al persistir `usageConditions` JSON)

## Matriz por tipo de reward

### 1) Campos base comunes (`BaseRewardSchema`)

Campos: `value`, `valueType`, `activationMethod`, `claimMethod`, `activationRestrictions`, `claimRestrictions`, `withdrawalRestrictions`, `status`, `statusDate`, `qualifyConditions`.

- Formulario: `RewardFormBase.tsx` (todos presentes).
- Defaults: `buildDefaultReward` (todos presentes).
- Backend:
  - Parse output: `reward.transformer.ts` / `promotion.transformer.ts`.
  - Serialize input/update: `reward.transformer.ts` y create/update en `promotion.transformer.ts`.
- Estado: **OK**.

### 2) FREEBET

- `typeSpecificFields`: `stakeNotReturned`
  - Formulario: checkbox SNR en `RewardFormBase.tsx`.
  - Default: `typeSpecificFields.stakeNotReturned: true`.
  - Backend parser: `parseTypeSpecificFieldsByRewardType('FREEBET', ...)`.
  - Estado: **OK**.

- `usageConditions` FREEBET:
  - `timeframe`, `mustUseComplete`, `voidConsumesBalance`, `lockWinningsUntilFullyUsed`,
    `oddsRestriction`, `stakeRestriction`, `allowMultipleBets`, `multipleBetCondition`,
    `allowLiveOddsChanges`, `betTypeRestrictions`, `selectionRestrictions`.
  - Formulario: `FreeBetUsageForm.tsx`.
  - Defaults: `buildDefaultReward('FREEBET')`.
  - Backend parser: `parseUsageConditionsByRewardType('FREEBET', ...)`.
  - Estado: **OK**.

### 3) BET_BONUS_ROLLOVER

- `usageConditions` ROLLOVER:
  - `multiplier`, `maxConversionMultiplier`, `expectedLossPercentage`, `bonusCanBeUsedForBetting`,
    `minBetsRequired`, `rolloverContributionWallet`, `realMoneyUsageRatio`,
    `noWithdrawalsAllowedDuringRollover`, `bonusCancelledOnWithdrawal`,
    `allowDepositsAfterActivation`, `returnedBetsCountForRollover`,
    `cashoutBetsCountForRollover`, `requireResolvedWithinTimeframe`,
    `countOnlySettledBets`, `maxConvertibleAmount`, `otherRestrictions`,
    `oddsRestriction`, `stakeRestriction`, `requiredBetOutcome`,
    `allowMultipleBets`, `multipleBetCondition`, `allowLiveOddsChanges`,
    `betTypeRestrictions`, `selectionRestrictions`.
  - Formulario: `RolloverUsageForm.tsx` (todos presentes).
  - Defaults: `buildDefaultReward('BET_BONUS_ROLLOVER')` (incluye `realMoneyUsageRatio: 50`).
  - Backend parser: `parseUsageConditionsByRewardType('BET_BONUS_ROLLOVER', ...)`.
  - Estado: **OK**.

- Regla de coherencia añadida:
  - Si `bonusCanBeUsedForBetting = false`:
    - `rolloverContributionWallet` solo puede ser `REAL_ONLY`.
    - `realMoneyUsageRatio` debe ser `100`.
  - Se valida en schema y se fuerza en UI.

### 4) BET_BONUS_NO_ROLLOVER

- `usageConditions`:
  - `maxConversionMultiplier`, `oddsRestriction`, `stakeRestriction`,
    `allowMultipleBets`, `multipleBetCondition`, `allowLiveOddsChanges`,
    `betTypeRestrictions`, `selectionRestrictions`, `timeframe`.
  - Formulario: `BonusNoRolloverUsageForm.tsx`.
  - Defaults: `buildDefaultReward('BET_BONUS_NO_ROLLOVER')`.
  - Backend parser: `parseUsageConditionsByRewardType('BET_BONUS_NO_ROLLOVER', ...)`.
  - Estado: **OK**.

### 5) CASHBACK_FREEBET

- `usageConditions`:
  - `cashbackPercentage`, `maxCashbackAmount`, `oddsRestriction`, `stakeRestriction`,
    `requiredBetOutcome`, `allowMultipleBets`, `multipleBetCondition`,
    `allowLiveOddsChanges`, `betTypeRestrictions`, `selectionRestrictions`, `timeframe`.
  - Formulario: `CashbackUsageForm.tsx`.
  - Defaults: `buildDefaultReward('CASHBACK_FREEBET')`.
  - Backend parser: `parseUsageConditionsByRewardType('CASHBACK_FREEBET', ...)`.
  - Estado: **OK**.

### 6) ENHANCED_ODDS

- `usageConditions`:
  - `normalOdds`, `enhancedOdds`, `stakeRestriction`,
    `allowMultipleBets`, `multipleBetCondition`,
    `betTypeRestrictions`, `selectionRestrictions`, `timeframe`.
  - Formulario: `EnhancedOddsUsageForm.tsx`.
  - Defaults: `buildDefaultReward('ENHANCED_ODDS')`.
  - Backend parser: `parseUsageConditionsByRewardType('ENHANCED_ODDS', ...)`.
  - Estado: **OK**.

### 7) CASINO_SPINS

- `usageConditions`: `spinsCount`, `gameTitle`, `timeframe`.
- Formulario: `CasinoSpinsUsageForm.tsx`.
- Defaults: `buildDefaultReward('CASINO_SPINS')`.
- Backend parser: `parseUsageConditionsByRewardType('CASINO_SPINS', ...)`.
- Estado: **OK**.

## Observaciones no bloqueantes

- En cashback/enhanced, `betTypeRestrictions` y `selectionRestrictions` estan en input de una linea; schema permite texto libre largo. No rompe datos, pero UX puede mejorar con `Textarea`.
- La coherencia de wallet en rollover ahora queda protegida en UI + schema (evita combinaciones invalidas).

## Conclusión

- Para rewards, el circuito **schema -> defaults -> formulario -> backend** está cubierto.
- No hay evidencia de que haya quedado a medio implementar ningún campo de reward en esta capa.
