# Deposits - Cascada y Tracking (implementado)

## Objetivo
Garantizar consistencia cuando se crea, edita o elimina un deposito vinculado a una `qualifyCondition` de tipo `DEPOSIT`.

## Reglas de negocio aplicadas
- Una `DEPOSIT` qualify condition solo puede tener **un deposito qualifying**.
- La edicion de deposito es permitida.
- El borrado de deposito es permitido.
- Al editar/borrar, se actualizan todos los efectos derivados (cascada).

## Cascada aplicada
Cuando el deposito es contextual (`qualifyConditionId` informado), se recalcula:
- `bookmakerAccount.realBalance`
- `rewardQualifyCondition.balance` y `trackingData`
- `reward.totalBalance`
- `phase.totalBalance`
- `promotion.totalBalance`
- `reward.value` (solo si la condicion DEPOSIT tiene `contributesToRewardValue = true`)

## Comportamiento de update
- No se permite cambiar `qualifyConditionId` en `deposit.update`.
- Si cambia importe:
  - se aplica delta a balances (`nuevo - anterior`).
- Si cambia bookmaker:
  - se revierte en la cuenta anterior y se aplica en la nueva.
- Se reescribe `trackingData` con los datos actuales del deposito.

## Comportamiento de delete
- Revierte saldo de `bookmakerAccount`.
- Revierte balances contextuales (`reward/phase/promotion/condition`).
- Limpia tracking de la condicion (`trackingData` vacio) y deja `condition.balance = 0`.
- Si la condicion aporta al valor de reward calculada, `reward.value` pasa a `0`.

## Nota operativa
Este comportamiento asume el modelo definido:
- 1 condicion DEPOSIT = 1 deposito qualifying.
Si se requiere multiplo deposito por una misma condicion, habra que cambiar contrato y tracking.
