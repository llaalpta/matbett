# Bet Registration, Tracking, And Reactive Recalculation Refactor Plan

## Status

Historical plan. This document contains useful implementation history and
calculation notes, but its open checkboxes are not the current backlog.

Before implementing any unchecked item from this file, verify it against the
current code and move the still-relevant work into `docs/backlog.md`.

## Bitacora viva (actualizar en cada iteracion)
- 2026-03-01:
  - [x] Prisma migrado a participaciones (`BetParticipation`, `DepositParticipation`) y reset completo validado.
  - [x] Frontend de depositos adaptado a `participations` (payload + listados).
  - [x] Limpieza de artefactos huerfanos: eliminado `DepositModal` (no usado) y `apps/frontend/src/types/context.ts`.
  - [x] Eliminado re-export huerfano en `apps/frontend/src/types/index.ts` tras retirar `context.ts`.
  - [x] Restaurado `DepositModal` con contexto basado en participaciones (`DepositRegistrationContext` local).
  - [x] `DepositQualifyModal` vuelve a permitir registrar depósito contextual (QC) abriendo `DepositModal`.
  - [x] Registro contextual de depósito ahora pasa contexto explícito completo desde formularios:
    - `promotionId + phaseId + rewardId + qualifyConditionId`.
  - [x] Implementado alta standalone real en `apps/frontend/src/app/deposits/new/page.tsx`.
  - [x] Shared: eliminado `BetSide` del modelo de apuesta (se mantiene `hedgeRole`/contexto de hedge).
  - [x] Shared: eliminado `hedgeRole` del core de `Bet`; ahora vive como `legRole` en `BetLegCreate` (registro batch).
  - [x] Revalidación post-refactor de apuesta:
    - `pnpm --filter @matbett/shared lint` OK
    - `pnpm --filter frontend lint` OK
    - `pnpm --filter backend lint` OK
    - `pnpm -r typecheck` OK
    - `pnpm --filter frontend ts` OK
  - [x] Shared: eliminado uso de `z.ZodIssueCode.custom` deprecado en schemas.
  - [x] Lint ejecutado:
    - `pnpm --filter @matbett/shared lint` OK
    - `pnpm --filter frontend lint` OK
    - `pnpm --filter backend lint` OK (tras corregir type assertion/noUnchecked access en `DepositService`)
  - [x] Typecheck ejecutado:
    - `pnpm -r typecheck` OK
    - `pnpm --filter frontend ts` OK

## Reglas de seguimiento (proceso)
- Tras cada decision funcional discutida, actualizar inmediatamente:
  - checklist de fase afectada;
  - pendientes abiertos;
  - riesgos o dudas no resueltas.
- Tras cada lote de cambios, registrar checks ejecutados (comando + resultado).
- No dejar componentes/tipos huerfanos: si no tienen call sites, eliminar o marcar explicitamente como pendiente con motivo.

## 1) Decisiones cerradas
- Se elimina `promotionContexts` de `BetSchema` como fuente de verdad.
- El modelo pasa a ser relacional y context-first: la mayoria de apuestas se registran desde tracking (QC o uso de reward).
- Se permite tambien registro standalone desde formulario de apuesta directo.
- El usuario puede registrar estrategias hedge (matched betting o dutching) con multiples apuestas en un solo submit.
- Los estados de `QualifyCondition` y de `Reward Usage Tracking` se cambian manualmente por usuario.
- Registrar apuestas y cambiar estado de apuestas solo recalcula tracking (progreso, rollover, acumulados), no cambia estados de QC/Reward automaticamente.
- Los calculos reactivos se basan en la configuracion de formulario + flags de ajuste (`UNMATCHED`, `PREPAYMENT`).
- El catalogo actual de calculo legacy contiene 41 funciones/escenarios unicos en `docs/legacy/calculate.ts`.

## 2) Objetivo de modelo (resumen)
- `Bet`: datos core de apuesta.
- `BetParticipation[]`: participacion contextual de la apuesta.
  - `role = QUALIFY_TRACKING`
  - `role = REWARD_USAGE`
- `HedgeGroup` (o equivalente): estrategia y modo del grupo de cobertura.
- Tracking con referencias a apuestas participantes para render en formularios contextuales y listados.

## 3) Checklist por fases

### Fase A - Invariantes de dominio
- [ ] Cerrar cardinalidades:
  - [ ] 1 apuesta puede tener 0..N participaciones.
  - [ ] 1 participacion pertenece a 1 apuesta.
  - [ ] participacion `QUALIFY_TRACKING` requiere `qualifyConditionId`.
  - [ ] participacion `REWARD_USAGE` requiere `usageTrackingId` o `rewardId` resoluble.
- [ ] Cerrar reglas de negocio:
  - [ ] tracking automatico de metricas, estados manuales.
  - [ ] registro batch para hedge en una sola operacion.
  - [ ] standalone permitido sin participaciones.

### Fase B - Refactor shared (schemas)
- [x] `bet.schema.ts`
  - [x] eliminar `promotionContexts`.
  - [x] introducir `BetParticipationSchema` discriminado por `role`.
  - [x] introducir contrato de registro batch (`RegisterBetsBatchSchema`).
  - [x] incluir discriminadores de calculo:
    - [x] `strategyType`
    - [x] `lineMode`
    - [x] `dutchingOptionsCount`
    - [x] `mode`
    - [x] `promoActionType`
    - [x] `rewardType`
    - [x] `hedgeAdjustmentType`
    - [x] `calculationFunctionId` (catalogo exacto actual)
  - [x] mover rol de leg hedge al contrato batch (`BetLegCreate.legRole`) y no al core de `Bet`.
- [x] `qualify-tracking.schema.ts`
  - [x] mantener acumulados.
  - [x] añadir referencias de bets participantes para UI/listados.
- [x] `usage-tracking.schema.ts`
  - [x] mantener acumulados por tipo.
  - [x] añadir referencias de bets participantes.
- [x] `deposit.schema.ts`
  - [x] eliminar `promotionContext`.
  - [x] mover contexto a `participations[]` (`DepositParticipation`).
- [x] `promotion.schema.ts`
  - [x] mantener input limpio de configuracion.
  - [x] definir read models para listados con apuestas/agrupaciones.
- [ ] alinear naming y enums con persistencia:
  - [ ] `commission` (no `bookmakerComission`).
  - [ ] `placedAt` (no `date`).
  - [ ] estado `PENDING`/equivalente alineado end-to-end.

### Fase C - Motor de calculo reactivo
- [ ] Refactor `docs/legacy/calculate.ts` a funciones puras `input -> output`.
- [ ] Eliminar estado global mutable compartido entre escenarios.
- [ ] Definir selector determinista:
  - [ ] de configuracion de formulario a `calculationFunctionId`.
- [ ] Definir trigger map por perfil y recalculo en cascada.
- [ ] **Pendiente (para despues de cerrar shared):** convertir el analisis funcion-a-funcion en una matriz de implementacion final (ids, mapeos, triggers y orden) alineada con nombres definitivos de schemas.
  - Referencia base actual: `apps/frontend/docs/matched-betting-calculation-dependency-map.md`
- [ ] Normalizar salida:
  - [ ] stakes calculados por leg.
  - [ ] risk/profit por leg.
  - [ ] balances por rama de status.
- [ ] Reset explicito de campos no aplicables en cambios de escenario.
- [ ] Corregir inconsistencias detectadas:
  - [ ] typo `comission` vs `commission`.
  - [ ] typo `freeBet.retainedProfit` vs `freeBet.profitRetained` en underlay generate.
  - [ ] coherencia de parametros en funciones sin typing fuerte.

### Fase D - API y backend (antes de Prisma final)
- [ ] Endpoint `registerBetsBatch` contextual + standalone.
- [ ] Endpoint(s) de lectura por contexto:
  - [ ] bets por QC
  - [ ] bets por reward usage
- [ ] En create/update de bet:
  - [ ] recalcular tracking correspondiente.
  - [ ] no tocar estado de QC/Reward.
- [ ] Devolver tracking actualizado tras registro contextual.

### Fase E - Prisma y migraciones
- [x] Crear/adaptar tablas relacionales para participacion contextual.
- [ ] Alinear modelo `Bet` de Prisma con shared (eliminar/repensar `type` BACK/LAY legacy si no se usa).
- [ ] Añadir constraints por role de participacion.
- [x] Añadir indices para listados complejos y filtros:
  - [x] por promotion/reward/qualifyCondition/usageTracking
  - [x] por hedgeGroup
  - [x] por fecha y estado de bet
- [ ] Plan de migracion de datos legacy (si aplica).

### Fase F - Frontend forms
- [ ] Formulario de apuesta standalone.
- [ ] Formularios contextuales (QC/Usage) con registro in-place.
- [ ] Registro simultaneo de 2..4 apuestas segun estrategia.
- [ ] Recalculo reactivo por triggers definidos.
- [ ] Vista tracking con apuestas participantes y agrupaciones.
- [ ] Cambio manual de estado de QC/Reward separado del registro de apuestas.

### Fase G - Testing y validacion
- [ ] Unit tests del selector de escenario.
- [ ] Unit tests de cada perfil de trigger.
- [ ] Unit tests de formulas criticas (stake/risk/profit/winBalance).
- [ ] Integration tests:
  - [ ] register batch contextual QC
  - [ ] register batch contextual usage
  - [ ] register standalone
- [ ] Regression tests de listados complejos y agrupaciones.

## 4) Modelo de configuracion de formulario (canonico)
Campos minimos para seleccionar escenario y trigger map:
- `context.kind`: `STANDALONE | QUALIFY_TRACKING | REWARD_USAGE`
- `strategyType`: `MATCHED_BETTING | DUTCHING | NONE`
- `lineMode`: `SINGLE | COMBINED_2 | COMBINED_3`
- `dutchingOptionsCount`: `2 | 3` (solo SINGLE + DUTCHING)
- `mode`: `STANDARD | UNDERLAY | OVERLAY`
- `promoActionType`: `NONE | GENERATE_REWARD | USE_REWARD`
- `rewardType`: p.ej. `FREEBET` (hoy las formulas solo cubren FREEBET)
- `hedgeAdjustmentType`: `NONE | UNMATCHED | PREPAYMENT`
- `calculationFunctionId`: id exacto de funcion activa (catalogo actual)

## 5) Mapa de dependencias y triggers de recalculo

### 5.1 Trigger sets (normalizados)
- `TG_SINGLE_2LEG_NUMERIC`
  - cambia: `mainForm.stake, mainForm.odds, mainForm.comission, hedge1Form.odds, hedge1Form.comission`
  - recalcula: `mainForm.{risk,profit,winBalance}, hedge1Form.{stake,risk,profit,winBalance}`
- `TG_SINGLE_DUTCH_3_NUMERIC`
  - cambia: `mainForm.*`, `hedge1Form.odds/comission`, `hedge2Form.odds/comission`
  - recalcula: `mainForm`, `hedge1Form`, `hedge2Form` (stakes, risk, profit, balances)
- `TG_PREPAYMENT_INPUTS`
  - cambia: `main2Form.odds, main2Form.comission` (+ trigger evento prepayment)
  - recalcula adicional: `main2Form.{stake,risk,profit,winBalance}` y balances globales
- `TG_UNMATCHED_INPUTS`
  - cambia: `matchedStake, cancelledStake, newOdds`
  - recalcula adicional: `hedge2Form.{stake,risk,profit,winBalance}` + balances globales
- `TG_COMBINED_2_NUMERIC`
  - cambia: `combinedMainForm.stake/odds/comission`, `hedge1Form.odds/comission`, `hedge2Form.odds/comission`
  - recalcula: stakes/risk/profit para `combinedMain, hedge1, hedge2`
- `TG_COMBINED_3_NUMERIC`
  - cambia: `combinedMainForm.stake/odds/comission`, `hedge1/2/3 odds/comission`
  - recalcula: stakes/risk/profit para `combinedMain, hedge1, hedge2, hedge3`
- `TG_STATUS_2_LINES`
  - cambia: `line1Status, line2Status`
  - recalcula: rama de `winBalance` en combined 2 lines
- `TG_STATUS_3_LINES`
  - cambia: `line1Status, line2Status, line3Status`
  - recalcula: rama de `winBalance` en combined 3 lines
- `TG_GENERATE_REWARD_PARAMS`
  - cambia: `refundRatio, refundValue` (en `mainForm` o `combinedMainForm`)
  - recalcula: `freeBet.profitRetained` y balances finales ligados
- `TG_USE_REWARD_PARAMS`
  - cambia: params del reward usado (hoy sobre todo FREEBET)
  - recalcula: riesgos/profit base del escenario `USE_REWARD` activo

### 5.2 Orden de recalc en cascada (estandar)
1. Seleccionar funcion por configuracion (`calculationFunctionId`).
2. Recalcular bloques base (main/combined main).
3. Recalcular stakes de hedges en orden de dependencia.
4. Recalcular risk/profit por leg.
5. Recalcular balances de resultado segun estado de lineas (si aplica).
6. Recalcular derivados de promo (`freeBet.profitRetained`, etc).
7. Limpiar campos no aplicables al escenario actual.

## 6) Ejemplo detallado: combined 3 lines dutching standard no promotion
Funcion: `calculate_combined_3_lines_dutching_standard_no_promotion(line1Status, line2Status, line3Status)`

Configuracion que la activa:
- `strategyType = DUTCHING`
- `lineMode = COMBINED_3`
- `mode = STANDARD`
- `promoActionType = NONE`
- `hedgeAdjustmentType = NONE`

Triggers:
- `TG_COMBINED_3_NUMERIC`
- `TG_STATUS_3_LINES`

Dependencias principales:
- `combinedMain` depende de `stake/odds/comission`.
- `hedge1.stake` depende de `combinedMain` y de `hedge2/hedge3` (odds/comission).
- `hedge2.stake` depende de `hedge1.stake`.
- `hedge3.stake` depende de `combinedMain`.
- `winBalance` final depende de `line1Status/line2Status/line3Status`.

## 7) Catalogo de escenarios (estado actual de calculate.ts)
Fuente: `docs/legacy/calculate.ts` (41 escenarios unicos detectados)

| # | functionName | configId | profile | triggerSet |
| --- | --- | --- | --- | --- |
| 1 | `calculate_combined_2_lines_dutching_standard_generate_freebet` | `DUTCHING__COMBINED_2__STANDARD__GENERATE_REWARD__FREEBET` | `PF_COMBINED_2_GENERATE` | `TG_COMBINED_2_NUMERIC, TG_STATUS_2_LINES, TG_GENERATE_REWARD_PARAMS` |
| 2 | `calculate_combined_2_lines_dutching_standard_no_promotion` | `DUTCHING__COMBINED_2__STANDARD__NONE` | `PF_COMBINED_2_BASE` | `TG_COMBINED_2_NUMERIC, TG_STATUS_2_LINES` |
| 3 | `calculate_combined_2_lines_dutching_standard_use_freebet` | `DUTCHING__COMBINED_2__STANDARD__USE_REWARD__FREEBET` | `PF_COMBINED_2_BASE` | `TG_COMBINED_2_NUMERIC, TG_STATUS_2_LINES, TG_USE_REWARD_PARAMS` |
| 4 | `calculate_combined_2_lines_matched_betting_standard_generate_freebet` | `MATCHED_BETTING__COMBINED_2__STANDARD__GENERATE_REWARD__FREEBET` | `PF_COMBINED_2_GENERATE` | `TG_COMBINED_2_NUMERIC, TG_STATUS_2_LINES, TG_GENERATE_REWARD_PARAMS` |
| 5 | `calculate_combined_2_lines_matched_betting_standard_no_promotion` | `MATCHED_BETTING__COMBINED_2__STANDARD__NONE` | `PF_COMBINED_2_BASE` | `TG_COMBINED_2_NUMERIC, TG_STATUS_2_LINES` |
| 6 | `calculate_combined_2_lines_matched_betting_standard_use_freebet` | `MATCHED_BETTING__COMBINED_2__STANDARD__USE_REWARD__FREEBET` | `PF_COMBINED_2_BASE` | `TG_COMBINED_2_NUMERIC, TG_STATUS_2_LINES, TG_USE_REWARD_PARAMS` |
| 7 | `calculate_combined_3_lines_dutching_standard_generate_freebet` | `DUTCHING__COMBINED_3__STANDARD__GENERATE_REWARD__FREEBET` | `PF_COMBINED_3_GENERATE` | `TG_COMBINED_3_NUMERIC, TG_STATUS_3_LINES, TG_GENERATE_REWARD_PARAMS` |
| 8 | `calculate_combined_3_lines_dutching_standard_no_promotion` | `DUTCHING__COMBINED_3__STANDARD__NONE` | `PF_COMBINED_3_BASE` | `TG_COMBINED_3_NUMERIC, TG_STATUS_3_LINES` |
| 9 | `calculate_combined_3_lines_dutching_standard_use_freebet` | `DUTCHING__COMBINED_3__STANDARD__USE_REWARD__FREEBET` | `PF_COMBINED_3_BASE` | `TG_COMBINED_3_NUMERIC, TG_STATUS_3_LINES, TG_USE_REWARD_PARAMS` |
| 10 | `calculate_combined_3_lines_matched_betting_standard_generate_freebet` | `MATCHED_BETTING__COMBINED_3__STANDARD__GENERATE_REWARD__FREEBET` | `PF_COMBINED_3_GENERATE` | `TG_COMBINED_3_NUMERIC, TG_STATUS_3_LINES, TG_GENERATE_REWARD_PARAMS` |
| 11 | `calculate_combined_3_lines_matched_betting_standard_no_promotion` | `MATCHED_BETTING__COMBINED_3__STANDARD__NONE` | `PF_COMBINED_3_BASE` | `TG_COMBINED_3_NUMERIC, TG_STATUS_3_LINES` |
| 12 | `calculate_combined_3_lines_matched_betting_standard_use_freebet` | `MATCHED_BETTING__COMBINED_3__STANDARD__USE_REWARD__FREEBET` | `PF_COMBINED_3_BASE` | `TG_COMBINED_3_NUMERIC, TG_STATUS_3_LINES, TG_USE_REWARD_PARAMS` |
| 13 | `calculate_simple_dutching_2_options_overlay_no_promotion` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__OVERLAY__NONE` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC` |
| 14 | `calculate_simple_dutching_2_options_overlay_prepayment` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__OVERLAY__NONE__PREPAYMENT` | `PF_SINGLE_PREPAYMENT` | `TG_SINGLE_2LEG_NUMERIC, TG_PREPAYMENT_INPUTS` |
| 15 | `calculate_simple_dutching_2_options_overlay_use_freebet` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__OVERLAY__USE_REWARD__FREEBET` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC, TG_USE_REWARD_PARAMS` |
| 16 | `calculate_simple_dutching_2_options_standard_generate_freebet` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__STANDARD__GENERATE_REWARD__FREEBET` | `PF_SINGLE_BASE_GENERATE` | `TG_SINGLE_2LEG_NUMERIC, TG_GENERATE_REWARD_PARAMS` |
| 17 | `calculate_simple_dutching_2_options_standard_no_promotion` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__STANDARD__NONE` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC` |
| 18 | `calculate_simple_dutching_2_options_standard_prepayment` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__STANDARD__NONE__PREPAYMENT` | `PF_SINGLE_PREPAYMENT` | `TG_SINGLE_2LEG_NUMERIC, TG_PREPAYMENT_INPUTS` |
| 19 | `calculate_simple_dutching_2_options_standard_use_freebet` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__STANDARD__USE_REWARD__FREEBET` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC, TG_USE_REWARD_PARAMS` |
| 20 | `calculate_simple_dutching_2_options_underlay_no_promotion` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__UNDERLAY__NONE` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC` |
| 21 | `calculate_simple_dutching_2_options_underlay_prepayment` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__UNDERLAY__NONE__PREPAYMENT` | `PF_SINGLE_PREPAYMENT` | `TG_SINGLE_2LEG_NUMERIC, TG_PREPAYMENT_INPUTS` |
| 22 | `calculate_simple_dutching_2_options_underlay_use_freebet` | `DUTCHING__SINGLE__DUTCH_2_OPTIONS__UNDERLAY__USE_REWARD__FREEBET` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC, TG_USE_REWARD_PARAMS` |
| 23 | `calculate_simple_dutching_3_options_standard_generate_freebet` | `DUTCHING__SINGLE__DUTCH_3_OPTIONS__STANDARD__GENERATE_REWARD__FREEBET` | `PF_SINGLE_DUTCH_3_GENERATE` | `TG_SINGLE_DUTCH_3_NUMERIC, TG_GENERATE_REWARD_PARAMS` |
| 24 | `calculate_simple_dutching_3_options_standard_no_promotion` | `DUTCHING__SINGLE__DUTCH_3_OPTIONS__STANDARD__NONE` | `PF_SINGLE_DUTCH_3_BASE` | `TG_SINGLE_DUTCH_3_NUMERIC` |
| 25 | `calculate_simple_dutching_3_options_standard_use_freebet` | `DUTCHING__SINGLE__DUTCH_3_OPTIONS__STANDARD__USE_REWARD__FREEBET` | `PF_SINGLE_DUTCH_3_BASE` | `TG_SINGLE_DUTCH_3_NUMERIC, TG_USE_REWARD_PARAMS` |
| 26 | `calculate_simple_dutching_3_options_underlay_no_promotion` | `DUTCHING__SINGLE__DUTCH_3_OPTIONS__UNDERLAY__NONE` | `PF_SINGLE_DUTCH_3_BASE` | `TG_SINGLE_DUTCH_3_NUMERIC` |
| 27 | `calculate_simple_matched_betting_overlay_generate_freebet` | `MATCHED_BETTING__SINGLE__OVERLAY__GENERATE_REWARD__FREEBET` | `PF_SINGLE_BASE_GENERATE` | `TG_SINGLE_2LEG_NUMERIC, TG_GENERATE_REWARD_PARAMS` |
| 28 | `calculate_simple_matched_betting_overlay_no_promotion` | `MATCHED_BETTING__SINGLE__OVERLAY__NONE` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC` |
| 29 | `calculate_simple_matched_betting_overlay_prepayment` | `MATCHED_BETTING__SINGLE__OVERLAY__NONE__PREPAYMENT` | `PF_SINGLE_PREPAYMENT` | `TG_SINGLE_2LEG_NUMERIC, TG_PREPAYMENT_INPUTS` |
| 30 | `calculate_simple_matched_betting_overlay_use_freebet` | `MATCHED_BETTING__SINGLE__OVERLAY__USE_REWARD__FREEBET` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC, TG_USE_REWARD_PARAMS` |
| 31 | `calculate_simple_matched_betting_standard_generate_freebet` | `MATCHED_BETTING__SINGLE__STANDARD__GENERATE_REWARD__FREEBET` | `PF_SINGLE_BASE_GENERATE` | `TG_SINGLE_2LEG_NUMERIC, TG_GENERATE_REWARD_PARAMS` |
| 32 | `calculate_simple_matched_betting_standard_generate_freebet_unmatched` | `MATCHED_BETTING__SINGLE__STANDARD__GENERATE_REWARD__FREEBET__UNMATCHED` | `PF_SINGLE_UNMATCHED` | `TG_SINGLE_2LEG_NUMERIC, TG_UNMATCHED_INPUTS, TG_GENERATE_REWARD_PARAMS` |
| 33 | `calculate_simple_matched_betting_standard_no_promotion` | `MATCHED_BETTING__SINGLE__STANDARD__NONE` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC` |
| 34 | `calculate_simple_matched_betting_standard_no_promotion_unmatched` | `MATCHED_BETTING__SINGLE__STANDARD__NONE__UNMATCHED` | `PF_SINGLE_UNMATCHED` | `TG_SINGLE_2LEG_NUMERIC, TG_UNMATCHED_INPUTS` |
| 35 | `calculate_simple_matched_betting_standard_prepayment` | `MATCHED_BETTING__SINGLE__STANDARD__NONE__PREPAYMENT` | `PF_SINGLE_PREPAYMENT` | `TG_SINGLE_2LEG_NUMERIC, TG_PREPAYMENT_INPUTS` |
| 36 | `calculate_simple_matched_betting_standard_use_freebet` | `MATCHED_BETTING__SINGLE__STANDARD__USE_REWARD__FREEBET` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC, TG_USE_REWARD_PARAMS` |
| 37 | `calculate_simple_matched_betting_standard_use_freebet_unmatched` | `MATCHED_BETTING__SINGLE__STANDARD__USE_REWARD__FREEBET__UNMATCHED` | `PF_SINGLE_UNMATCHED` | `TG_SINGLE_2LEG_NUMERIC, TG_UNMATCHED_INPUTS, TG_USE_REWARD_PARAMS` |
| 38 | `calculate_simple_matched_betting_underlay_generate_freebet` | `MATCHED_BETTING__SINGLE__UNDERLAY__GENERATE_REWARD__FREEBET` | `PF_SINGLE_BASE_GENERATE` | `TG_SINGLE_2LEG_NUMERIC, TG_GENERATE_REWARD_PARAMS` |
| 39 | `calculate_simple_matched_betting_underlay_no_promotion` | `MATCHED_BETTING__SINGLE__UNDERLAY__NONE` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC` |
| 40 | `calculate_simple_matched_betting_underlay_prepayment` | `MATCHED_BETTING__SINGLE__UNDERLAY__NONE__PREPAYMENT` | `PF_SINGLE_PREPAYMENT` | `TG_SINGLE_2LEG_NUMERIC, TG_PREPAYMENT_INPUTS` |
| 41 | `calculate_simple_matched_betting_underlay_use_freebet` | `MATCHED_BETTING__SINGLE__UNDERLAY__USE_REWARD__FREEBET` | `PF_SINGLE_BASE` | `TG_SINGLE_2LEG_NUMERIC, TG_USE_REWARD_PARAMS` |

## 8) Perfiles de calculo usados en el catalogo
- `PF_SINGLE_BASE`: single 2-leg sin generate.
- `PF_SINGLE_BASE_GENERATE`: single 2-leg con generate reward.
- `PF_SINGLE_PREPAYMENT`: single con prepayment (incluye main2).
- `PF_SINGLE_UNMATCHED`: single con unmatched (incluye hedge2 adicional).
- `PF_SINGLE_DUTCH_3_BASE`: single dutching 3 options sin generate.
- `PF_SINGLE_DUTCH_3_GENERATE`: single dutching 3 options con generate.
- `PF_COMBINED_2_BASE`: combinada 2 lineas sin generate.
- `PF_COMBINED_2_GENERATE`: combinada 2 lineas con generate.
- `PF_COMBINED_3_BASE`: combinada 3 lineas sin generate.
- `PF_COMBINED_3_GENERATE`: combinada 3 lineas con generate.

## 9) Notas abiertas para siguiente iteracion
- Las formulas actuales solo cubren `FREEBET` como reward en use/generate.
- Para soportar `USE_REWARD` y `GENERATE_REWARD` con otros reward types:
  - definir nuevos `calculationFunctionId` o un motor parametrico por `rewardType`.
- Antes de migrar Prisma:
  - cerrar contrato final de schemas shared,
  - congelar catalogo de escenarios y trigger map.
