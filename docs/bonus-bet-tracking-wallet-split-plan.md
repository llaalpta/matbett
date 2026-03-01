# Plan - Tracking de apuestas con cartera real/bono

## Objetivo
Modelar de forma fiable apuestas realizadas con saldo mixto (real + bono) para:
- calcular rollover correctamente;
- evitar ambiguedades en auditoria;
- soportar reglas por casa sobre cuenta de bono/cuenta real.

## Principio de modelado
Cada apuesta debe guardar:
- importe total apostado;
- desglose por origen de fondos;
- regla de cartera aplicada por la casa en ese momento;
- contribucion real al rollover.

No basta con un booleano "apuesta con bono".

---

## Estructura recomendada para tracking de apuesta (futura)

### BetTracking (nuevo/extendido)
- `stakeTotal: number`
- `stakeSplit.realStake: number`
- `stakeSplit.bonusStake: number`
- `walletPolicyAtBet: 'REAL_FIRST' | 'BONUS_FIRST' | 'MIXED'`
- `rolloverContributionAmount: number` (valor final que computa)
- `rolloverContributionSource: 'REAL_ONLY' | 'BONUS_ONLY' | 'MIXED'`
- `isEstimatedSplit: boolean` (cuando el usuario no conoce desglose exacto)
- `rewardId` (a que reward/rollover imputa la apuesta)

### Resultado de apuesta (si aplica en el tracking)
- `payoutSplit.realPayout?: number`
- `payoutSplit.bonusPayout?: number`
- `payoutSplit.cashablePayout?: number`
- `payoutSplit.nonCashablePayout?: number`

---

## Campos que conviene anadir AHORA en configuracion de reward (usageConditions)
Estos campos mejoran el analisis y luego evitan rehacer schema/UI:

1) `returnedBetsCountForRollover: boolean` (default `false`)
- Muchas casas excluyen nulas/devueltas.

2) `cashoutBetsCountForRollover: boolean` (default `false`)
- Muy frecuente en TyC de sportsbook.

3) `requireResolvedWithinTimeframe: boolean` (default `true`)
- Si solo cuentan apuestas liquidadas dentro del plazo.

4) `maxConvertibleAmount?: number`
- Tope de conversion a saldo real (cuando existe).

5) `countOnlySettledBets: boolean` (default `true`)
- Aclara si abiertas cuentan o no.

6) `otherRestrictions?: string`
- Texto libre para restricciones de mercado/evento/reglas especiales.

7) `rolloverEligibleWallet: 'BONUS_ONLY' | 'REAL_ONLY' | 'MIXED'`
- Fuente contractual de computo (mas claro que varios flags).

8) `walletPolicyHint?: 'REAL_FIRST' | 'BONUS_FIRST' | 'MIXED'`
- Como suele descontar saldo la casa (para guiar tracking y simulacion).

## Relacion con campos actuales
- `onlyBonusMoneyCountsForRollover` y `onlyRealMoneyCountsForRollover` pueden mantenerse temporalmente.
- Recomendacion: migrar a `rolloverEligibleWallet` (enum unico) para eliminar conflicto entre flags.

---

## Campos que NO hace falta mover ahora a QualifyCondition
La mayoria de reglas anteriores pertenecen a `usageConditions` de reward, no a `qualifyCondition`.
`qualifyCondition` debe seguir centrado en condiciones de activacion/calificacion (deposito, apuesta minima de entrada, codigo, etc.).

---

## Reglas de UI/validacion recomendadas
- Si `rolloverEligibleWallet = REAL_ONLY` y `allowDepositsAfterActivation = false`:
  - mostrar alerta critica: requiere capital total previo en bookmaker.
- Si `returnedBetsCountForRollover = false`:
  - mostrar que nulas/devueltas no computan.
- Tracking manual:
  - validar `realStake + bonusStake = stakeTotal`.

---

## Plan de implementacion (orden)
1. Extender schema shared (`usage-conditions`) con campos nuevos.
2. Actualizar defaults/formulario de rollover en frontend.
3. Ajustar calculadora y panel para usar campos nuevos.
4. Preparar contrato de tracking de apuesta con `stakeSplit`.
5. Implementar formulario tracking de apuesta (fase posterior).

## Impacto backend actual
- No requiere migracion Prisma en esta fase: `usageConditions` se guarda en `Json`.
- Backend ya valida con schemas compartidos (`PromotionSchema`/`RewardSchema`), por lo que los campos nuevos viajan y persisten sin mapper adicional.
- Verificado con typecheck de `backend` y `@matbett/api`.

---

## Hallazgos de diseno (casos reales de sportsbook)

### 1) Cartera mixta real+bono no es opcional
Algunas casas consumen saldo en orden fijo y permiten apuestas con mezcla de fondos.
Para tracking futuro se mantiene obligatorio:
- `stakeSplit.realStake`
- `stakeSplit.bonusStake`
- `walletPolicyAtBet`

### 2) El orden de consumo suele ser regla global de la promocion/casa
No siempre pertenece a una reward concreta.
Recomendacion: modelarlo a nivel `promotion` (o perfil de bookmaker) y no duplicarlo en cada reward.

### 3) Rollover con saldo real puede coexistir con saldo bono
El modelo debe distinguir:
- fuente que computa para rollover;
- fuente usada realmente en cada apuesta (tracking).
Sin esta separacion no hay auditoria fiable.

---

## Ajustes recomendados en configuracion (estado actual)

### Mantener como esta (ya suficiente para fase de diseno)
- `rolloverContributionWallet` (`BONUS_ONLY | REAL_ONLY | MIXED`)
- `bonusCanBeUsedForBetting`
- `returnedBetsCountForRollover`
- `cashoutBetsCountForRollover`
- `requireResolvedWithinTimeframe`
- `countOnlySettledBets`
- `maxConversionMultiplier`
- `maxConvertibleAmount`
- textos: `betTypeRestrictions`, `selectionRestrictions`, `otherRestrictions`
- textos adicionales: `activationRestrictions`, `withdrawalRestrictions`

### Nota de diseno
El enum de fuente de contribucion ya reemplaza los dos booleans previos y evita conflicto de flags.

### Campo adicional opcional (si queremos capturar politica de casa)
- `walletConsumptionOrderHint?: 'CASHBACK_REAL_BONUS' | 'REAL_FIRST' | 'BONUS_FIRST' | 'CUSTOM'`
- `walletConsumptionOrderNotes?: string`

No afecta calculo base de EV, pero ayuda mucho en tracking operativo y explicabilidad.
