# Plan de Implementacion - Bonos, Rollover, Profitability y Panel de Analisis

## Contexto y reglas de trabajo
- Proyecto en desarrollo, sin produccion: se permite refactor sin retrocompatibilidad.
- Prioridad funcional: `promotion > phase > reward > qualifyCondition`.
- El tracking no se elimina, pero no se prioriza su pulido visual en esta fase.
- Objetivo de esta iteracion: dejar robusta la configuracion inicial de bonos/rollover y la coherencia del calculo/analysis.
- Referencia complementaria para tracking de cartera real/bono: `docs/bonus-bet-tracking-wallet-split-plan.md`.
- Convenciones de naming/terminologia: `docs/bonus-rollover-naming-conventions.md`.

---

## Estado actual (resumen)
- [x] `reward.create` eliminado del flujo standalone (solo se crea reward desde promotion).
- [x] `reward.update` en backend ya persiste cambios de reward + QC hijas en standalone.
- [x] Politica formal de borrado jerarquico implementada en backend + guardas draft en frontend.
- [x] Profitability aun usa hardcodes y lecturas no reactivas.

---

## Objetivos
- [x] Corregir inconsistencias criticas de persistencia y contratos backend/frontend.
- [x] Unificar reglas de negocio de bonus/rollover entre schema, UI y servicios.
- [x] Hacer el calculo de profitability consistente, reactivo y sin datos hardcodeados.
- [x] Dejar el panel de analisis alineado con el calculo real y con mensajes correctos.

---

## Hallazgos criticos a resolver (baseline)
- [x] `reward.update` no persistia edicion anidada de `qualifyConditions` en standalone reward.
- [x] `reward.create` estaba mal cableado (se pasaba `userId` donde se esperaba `phaseId`).
- [x] `RolloverUsageForm` calcula analysis con valores hardcode (`bonusValue=100`, `depositRequired=0`).
- [x] `RolloverAnalysisPanel` usa condiciones/mensajes parcialmente desalineados con el hook de calculo.
- [x] Politica de deposito alineada: sin bloqueos automaticos por timeframe/firstDepositOnly/codigo; gestion manual de estado por usuario.

---

## Plan detallado por fases

## Fase 0 - Contratos y decisiones de dominio
Objetivo: cerrar decisiones para evitar retrabajo en fases tecnicas.

### Checklist
- [x] Definir fuente de verdad del profitability: simulacion UI (frontend) vs endpoint backend (siempre o futuro).
- [x] Definir nivel minimo obligatorio para `BET_BONUS_ROLLOVER` en creacion.
- [x] Definir comportamiento cuando faltan datos para analisis (estado incompleto, no null silencioso).
- [x] Definir si el analysis influye en validacion de submit o solo UX informativa.

### Criterio de salida
- [x] Seccion "Decisiones tomadas" actualizada.

---

## Fase 1 - Backend critico (persistencia y contratos)
Objetivo: que reward standalone sea funcional y consistente con modelo.

### 1.1 Router/servicio de reward
- [x] Retirar `reward.create` standalone del router.
- [x] Ajustar contratos/tipos relacionados (`IRewardService`, hooks frontend).
- [x] Eliminar codigo placeholder de create standalone.

### 1.2 Persistencia anidada de QC en `reward.update`
- [x] Persistir create/update/set de `qualifyConditions` en standalone reward.
- [x] Soportar `id/clientId` transitorios.
- [x] Validar asociacion al pool de la promotion.
- [x] Persistir `dependsOnQualifyConditionId` y `timeframe` en nested update.
- [x] Resolver anchors `client/persisted` en usageConditions y QC.

### 1.3 Reglas de deposito (servicio)
- [x] Mantener politica manual: no validacion automatica de timeframe/firstDepositOnly/codigo en backend.
- [x] Mantener recálculo automatico de valor de reward solo cuando la condicion lo configure (`contributesToRewardValue`).
- [x] Mantener cambios de estado manuales (sin transiciones automaticas por deposito).

### Criterio de salida
- [x] Reward standalone persiste cambios de QC correctamente.
- [x] Reglas de deposito alineadas con politica manual definida.

---

## Fase 1.5 - Integridad jerarquica y borrado (NUEVO)
Objetivo: aplicar regla estricta "no borrar padre con hijos" tanto en draft frontend como en backend.

### Politica funcional acordada
- [x] `promotion.delete` elimina en cascada todo el arbol (fases, rewards, qualifyConditions y tracking asociado).
- [x] `promotion.delete` requiere confirmacion explicita en UI con mensaje de impacto.
- [x] No borrar `phase` si tiene `rewards`.
- [x] No borrar `reward` si tiene `qualifyConditions`.
- [x] No borrar `qualifyCondition` si tiene hijos/uso (asociaciones, deposits, bets, tracking).
- [x] En reward standalone, quitar QC desasocia de la reward; backend elimina del pool las QC huerfanas (sin rewards).

### Backend checklist
- [x] Endpoint `delete` para qualifyCondition con guardas de hijos/uso.
- [x] Guardas equivalentes en `reward.delete` y `phase.delete` (promotion borra en cascada).
- [x] Errores de negocio claros (motivo + dependencias que bloquean borrado).
- [x] Mantener transaccionalidad en operaciones de desasociacion/borrado.
- [x] En `reward.update`, limpiar QC huerfanas del pool de la promotion (sin rewards).
- [x] `qualifyCondition.getById/update` exponen `canDelete` coherente (incluye dependencias entre QC).

### Frontend draft checklist (entidades temporales)
- [x] Utilidad de grafo en memoria para validacion de borrado por `clientId/tempId`.
- [x] Bloqueo de borrado en UI cuando haya hijos temporales o referencias cruzadas.
- [x] Mensaje explicito en UI indicando que hay que borrar hijos primero.
- [x] Misma semantica en promotion form y reward standalone.

### Criterio de salida
- [ ] Mismo comportamiento de integridad en draft (frontend) y persistido (backend).
- [ ] No hay borrados implicitos no deseados.

---

## Fase 2 - Coherencia de schemas y formularios de rollover
Objetivo: que UI, schema y negocio no se contradigan.

### Checklist
- [x] Revisar optional vs required de campos rollover en `packages/shared`.
- [x] Alinear labels/UI de obligatorio con reglas reales del schema.
- [x] Definir defaults explicitos y consistentes (`formDefaults`) para bonus con y sin rollover.
- [x] Evitar campos semanticamente conflictivos sin feedback claro (bonusOnly + realOnly).

### Criterio de salida
- [x] Sin contradicciones entre validacion zod y UX de formulario.

---

## Fase 3 - Profitability calculation robusto
Objetivo: calculo estable, reactivo, sin hardcodes, y trazable.

### 3.1 Fuente de datos real
- [x] Eliminar hardcodes en `RolloverUsageForm`.
- [x] Alimentar `bonusValue` desde valor real de reward en formulario.
- [x] Alimentar `depositRequired` desde condiciones DEPOSIT configuradas en la reward.

### 3.2 Reactividad
- [x] Cambiar lecturas `getValues` por `useWatch` donde corresponda (RolloverUsageForm).
- [x] Garantizar recomputacion al cambiar cuotas, stake limits, multiplicador, restricciones.

### 3.3 Reglas y consistencia interna
- [x] Unificar condiciones invalidas entre hook y panel.
- [x] Reemplazar textos estaticos (ej. "30% prob.") por datos calculados.
- [x] Estandarizar redondeos/moneda y manejo de null/incompleto.

### Criterio de salida
- [x] Panel refleja exactamente los datos y reglas del hook.

---

## Fase 4 - Panel de analisis (UX tecnica)
Objetivo: panel util para decision, sin ruido ni inconsistencias.

### Checklist
- [x] Estados claros: `incompleto`, `invalido`, `valido rentable`, `valido no rentable`.
- [x] Mensajes accionables (que bloquea underlay y como corregir).
- [x] Mostrar metricas minimas: EV, ROI, capital total, capital exchange, riesgo por euro.
- [x] Mostrar hipotesis del calculo (perdida esperada, odds/rangos, restricciones activas).

### Criterio de salida
- [x] El panel explica resultado y permite corregir inputs sin ambiguedad.

---

## Modelo actual del arbol de decisiones (implementado)

Fuente de verdad: `apps/frontend/src/hooks/useRolloverProfitabilityCalculation.ts`.

### 1) Precondicion de calculo (estado incompleto)
- Si falta alguno de estos campos, no hay analisis:
  - `bonusValue > 0`
  - `multiplier > 0`
  - `expectedLossPercentage` en rango `[0..100]`
- Resultado: `analysis = null` (UI: "Analisis incompleto").

### 2) Validacion de configuracion (estado invalido)
- Bloquea inmediatamente:
  - `maxOdds < minOdds`
  - `minStake > maxStake`
- Resultado: estrategia `AVOID`.

### 3) Viabilidad economica base
- Se calcula `worstCaseNetProfit = bonusValue - (totalRollover * expectedLossRatio)`.
- Si `worstCaseNetProfit <= 0` => estrategia `AVOID`.

### 4) Viabilidad de underlay
- `canUseUnderlay = !mustUseRealMoneyOnly`.
- `mustUseRealMoneyOnly` se activa si ocurre cualquiera:
  - `rolloverContributionWallet === REAL_ONLY`
  - `maxConversionMultiplier <= minOdds efectiva`
  - `maxStake < firstBetAmount (bono + deposito)`
  - `bonusCanBeUsedForBetting === false`
- Si `canUseUnderlay === true` => estrategia `UNDERLAY_FIRST`.
- Incluso en `UNDERLAY_FIRST` se calculan tambien planes estandar desde inicio
  (rama A.2) para comparar contra el intento underlay.
- Si `requiredBetOutcome !== ANY`, el flujo pasa a `NO_LOW_RISK_PATH` y se marca
  no viable para matched betting sin riesgo.

### 5) Si no hay underlay
- Se decide entre:
  - `STANDARD_ONLY` si `worstCaseNetProfit > 0`
  - `AVOID` en caso contrario.
- Cuando `STANDARD_ONLY` viene forzado por restricciones de conversion/stake/uso de
  bono, el modo interno es `STANDARD_REAL_MONEY` (equivalente al "tipo 2" operativo).

### 5.1 Señales estrategicas clave (panel)
- `avoidBonusFundsForRollover`: avisa cuando usar saldo bono para liberar degrada EV
  (caso tipico: conversion maxima por debajo de cuota minima o bono no usable).
- `fullBookmakerBankrollRequiredUpfront`: avisa que se necesita saldo completo por
  adelantado si no se permiten depositos posteriores.
- `lowRiskMatchedBettingPossible`: si es `false`, se considera sin via de matched
  betting sin riesgo y la salida recomendada es `AVOID`.

### 6) Generacion de planes A/B/C/D (estandar o continuacion tras underlay)
- Los planes se construyen con targets de stake realistas: `200`, `150`, `100`, `50` EUR.
- Siempre respetando:
  - `minStake`, `maxStake`
  - `minBetsRequired`
  - `rolloverAmount` a cubrir.
- Salida: hasta 4 alternativas etiquetadas `Plan A`, `Plan B`, `Plan C`, `Plan D`.

### Finales posibles (conteo)
- **Salidas del motor de recomendacion**: **4**
  1. `INCOMPLETO` (sin analisis)
  2. `AVOID`
  3. `UNDERLAY_FIRST`
  4. `STANDARD_ONLY`
- **Finales operativos de ejecucion** (si se ejecuta la estrategia): **5**
  1. No ejecutar (`AVOID`)
  2. Estandar directo (`STANDARD_ONLY`)
  3. Underlay y cierre inmediato (si pierde primera en bookmaker)
  4. Underlay + continuacion estandar (si gana primera en bookmaker)
  5. Sin decision por datos incompletos

---

## Fase 5 - Limpieza y consolidacion
Objetivo: cerrar deuda tecnica asociada.

### Checklist
- [x] Eliminar componentes/hooks huerfanos o no usados (`RewardPreviewCalculator` si no se integra).
- [x] Revisar duplicidades de logica entre promotion/reward transformers.
- [x] Revisar TODO desactualizados y dejar backlog explicito.
- [x] Alinear naming y docs de bonus/rollover.

### Criterio de salida
- [ ] Codigo sin caminos muertos en este modulo.

### Backlog TODOs explicito (resultado de revision)
- [x] `apps/frontend/src/components/molecules/DepositModal.tsx`
  - Manejo de error unificado con helper compartido + feedback visual inline en modal.
- [x] `apps/frontend/src/hooks/api/useDeposits.ts`
  - Invalida cache de promotion/anchors/availableQC en create/update/delete cuando hay `promotionId` contextual.

---

## Fase 6 - Verificacion tecnica (por cada cambio)
Regla operativa: despues de cada cambio, validar archivo(s) tocado(s).

### Checklist recurrente
- [x] TypeScript de archivo o paquete afectado.
- [x] ESLint de archivo o paquete afectado.
- [x] Build de `@matbett/shared` si cambia contrato.
- [x] Smoke manual de flujo principal (create/edit promotion + reward standalone).

### Comandos guia
- `pnpm.cmd --filter frontend ts`
- `pnpm.cmd --filter backend ts`
- `pnpm.cmd --filter @matbett/shared build`
- `pnpm.cmd --filter @matbett/shared lint`
- `pnpm.cmd --filter @matbett/api ts`

---

## Orden de ejecucion propuesto
1. Fase 1.3 (deposit rules)
2. Fase 1.5 (integridad y borrado)
3. Fase 2 (schema/form coherencia)
4. Fase 3 (profitability)
5. Fase 4 (panel analisis)
6. Fase 5 (limpieza)
7. Fase 6 (verificacion transversal continua)

---

## Decisiones tomadas
- [x] Reward standalone no crea rewards nuevas; solo edicion.
- [x] Reward standalone persiste cambios de sus QC hijas y usa pool de promotion.
- [x] Al desasociar QC desde reward, backend borra automaticamente las QC huerfanas del pool.
- [x] Regla de integridad objetivo: no borrar padre con hijos en `phase/reward/qualifyCondition` (en draft y persistido).
- [x] Excepcion deliberada: `promotion` se borra en cascada con confirmacion fuerte en frontend.
- [x] Cambiar tipo de reward no borra sus QC: se preservan asociaciones/configuracion existentes.
- [x] Restricciones de activacion/canjeo y retirada movidas a `Reward` base (no en `usageConditions`).
- [x] Profitability se calcula en frontend y es UX informativa (no bloquea submit).
- [x] Estado incompleto del analisis visible en UI cuando faltan inputs.
- [x] En rollover: `multiplier` y `expectedLossPercentage` obligatorios; limites de odds/stake/minBets/maxConversion opcionales con semantica \"sin restriccion\".

### Pendientes abiertos (control)
- [x] Definir y cerrar politica de borrado para endpoint standalone de `qualifyCondition` (hijos/uso/tracking).
- [x] Completar checks globales de toolchain (`@matbett/shared` resolution + TS global frontend) antes de marcar DoD.

---

## Riesgos y mitigaciones
- Riesgo: cambios en contratos compartidos rompen frontend/backend.
  - Mitigacion: validar `shared`, `api`, `backend`, `frontend` en cadena.
- Riesgo: nested updates de QC introducen regresiones en pool de promotion.
  - Mitigacion: separar create/update/set y validar IDs transitorios/persistidos.
- Riesgo: profitability se percibe exacto siendo estimacion.
  - Mitigacion: exponer hipotesis y estado "estimado".

---

## Definicion de Done (DoD)
- [ ] Reward standalone guarda y recupera correctamente qualifyConditions y usageConditions.
- [ ] Integridad jerarquica de borrado aplicada (frontend draft + backend).
- [x] Bonus rollover/no-rollover consistente entre schema, UI y backend.
- [x] Profitability sin hardcodes y reactivo a cambios de formulario.
- [x] Panel de analisis coherente con calculo, sin mensajes contradictorios.
- [x] TS/Lint en verde en paquetes impactados.
