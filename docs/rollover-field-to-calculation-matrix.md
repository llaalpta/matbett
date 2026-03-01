# Matriz Campo -> Efecto de Calculo (Rollover)

## Objetivo
Definir, por cada campo de configuracion de `BET_BONUS_ROLLOVER`, si:
- impacta calculo economico (EV/ROI),
- impacta viabilidad/factibilidad del plan,
- impacta recomendaciones operativas,
- o es solo informativo por ahora.

---

## Nucleo economico

- `reward.value`  
  - Rol: **obligatorio**.  
  - Efecto: valor base del bono (`B`).

- `multiplier`  
  - Rol: **obligatorio**.  
  - Efecto: `totalRollover = B * multiplier`.

- `expectedLossPercentage`  
  - Rol: **obligatorio**.  
  - Efecto: perdida esperada sobre volumen apostado.

- `depositRequired` (derivado de QC `DEPOSIT`)  
  - Rol: **obligatorio**.  
  - Efecto: capital inicial requerido en book.

---

## Reglas de conversion / estrategia inicial

- `maxConversionMultiplier` + `oddsRestriction.minOdds`  
  - Rol: **bloqueante de underlay inicial**.  
  - Efecto: si `maxConversionMultiplier <= minOdds`, underlay inicial con saldo bono no recomendado/factible.

- `bonusCanBeUsedForBetting`  
  - Rol: **bloqueante de underlay con saldo bono**.  
  - Efecto: si `false`, no usar bono en primera apuesta.

---

## Restricciones de stake (plan de ejecucion)

- `stakeRestriction.maxStake`  
  - Rol: **obligatorio para plan**.  
  - Efecto: limita stake por apuesta y aumenta apuestas necesarias.

- `stakeRestriction.minStake`  
  - Rol: **obligatorio para plan**.  
  - Efecto: define stake minimo; puede volver inviable cumplir `minBetsRequired` sin pasarse.

---

## Restricciones de cuotas (plan y viabilidad)

- `oddsRestriction.minOdds`  
  - Rol: **obligatorio**.  
  - Efecto: condicion minima de cuota para computar rollover.

- `oddsRestriction.maxOdds`  
  - Rol: **obligatorio para propuesta de cuotas**.  
  - Efecto: acota el rango operativo; puede invalidar recomendaciones si el rango es estrecho.

---

## Estructura de particion del rollover

- `minBetsRequired`  
  - Rol: **obligatorio para sugerencias**.  
  - Efecto: `numBets >= minBetsRequired`; condiciona stake sugerido.

- `allowMultipleBets` + `multipleBetCondition.*`  
  - Rol: **factibilidad operativa**.  
  - Efecto: no cambia EV base directamente, pero condiciona ejecucion real de plan (mercado/liquidez).

---

## Reglas de computo de dinero

- `onlyBonusMoneyCountsForRollover`  
  - Rol: **regla de computo**.  
  - Efecto: parte del rollover solo computa con saldo bono.

- `onlyRealMoneyCountsForRollover`  
  - Rol: **regla de computo**.  
  - Efecto: rollover solo computa con dinero real (sube capital requerido en book).

- `onlyBonusMoneyCountsForRollover && onlyRealMoneyCountsForRollover`  
  - Rol: **configuracion invalida**.  
  - Efecto: bloqueo por validacion de schema + inconsistencia marcada en analisis.

---

## Liquidez temporal / disponibilidad de capital

- `allowDepositsAfterActivation`  
  - Rol: **timing de capital**.  
  - Efecto:
    - `false`: exigir capital completo upfront.
    - `true`: permitir fondeo progresivo.
  - Regla aplicada: si `onlyRealMoneyCountsForRollover=true` y `allowDepositsAfterActivation=false`, mostrar alerta critica de capital real upfront.

---

## Restricciones de retirada

- `noWithdrawalsAllowedDuringRollover`  
  - Rol: **riesgo operativo**.  
  - Efecto: no cambia EV base, pero implica bloqueo de fondos.

- `bonusCancelledOnWithdrawal`  
  - Rol: **riesgo severo**.  
  - Efecto: retirada puede invalidar la estrategia/bono; mostrar alerta critica.

---

## Resultado requerido y friccion

- `requiredBetOutcome`  
  - Rol: **riesgo operativo**.  
  - Efecto: no ajusta EV en este motor; se refleja como warning de dificultad.

- `allowLiveOddsChanges`  
  - Rol: **friccion operativa**.  
  - Efecto: mayor incertidumbre en ejecucion, sin cambiar EV base inicial.

- `betTypeRestrictions`, `selectionRestrictions`  
  - Rol: **friccion operativa**.  
  - Efecto: reducen oportunidades reales; inicialmente informativo con warning.

---

## Estado de implementacion actual (resumen)

- Ya aplicado:
  - `reward.value`, `multiplier`, `expectedLossPercentage`, `minBetsRequired`
  - `maxConversionMultiplier`, `oddsRestriction.minOdds`, `oddsRestriction.maxOdds`
  - `stakeRestriction.maxStake`, `stakeRestriction.minStake`
  - `onlyBonusMoneyCountsForRollover`, `onlyRealMoneyCountsForRollover`
  - `bonusCanBeUsedForBetting`
  - `allowDepositsAfterActivation`
  - `requiredBetOutcome`
  - `noWithdrawalsAllowedDuringRollover`, `bonusCancelledOnWithdrawal`
  - eliminacion de hardcodes (`bonusValue`, `depositRequired`)

- Pendiente de incorporar al motor:
  - reglas `multipleBetCondition.*`
  - `allowLiveOddsChanges`, `betTypeRestrictions`, `selectionRestrictions` como friccion operativa

---

## Supuestos del modelo (actuales)

Estos valores no salen del formulario del usuario; son heuristicas internas del motor:

- curva de `exchangeRiskPerEuro` por tramos de cuota minima;
- curva de `exchangeRiskPerEuro` por tramos de cuota minima.

Nota: no son "datos fake" del bono; son parametros de estimacion operativa.
