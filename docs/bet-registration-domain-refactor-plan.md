# Bet Registration Domain Refactor Record

## Status

Historical architecture record. The model decisions in this document are useful
context, but this is not the current active work queue.

Use `docs/bet-registration-implementation-plan.md` for functional behavior and
`docs/backlog.md` for current next work.

## Resumen
Este documento fija la version final del modelo para soportar:
1. Registro standalone.
2. Registro en contexto promocional (tracking QC / uso de rewards).
3. Un mismo batch con lineas que participan en multiples promociones simultaneas.

Regla principal:
1. `strategyContext` y `calculationContext` viven en el batch.
2. El contexto promocional vive por linea en `BetParticipation`.
3. Una linea puede tener 0..N participaciones promocionales.

## Principios de arquitectura
1. Cada linea registrada es una `Bet` real.
2. No existe tabla intermedia de legs (`bet_batch_legs`).
3. El batch solo modela contexto comun de estrategia/calculo.
4. Las participaciones promocionales no se guardan en `Bet` embebidas: se modelan en tabla relacional `bet_participations`.
5. Un `Bet` puede participar en varias promociones/trackings al mismo tiempo.
6. `legRole` (MAIN/HEDGE1/...) y rol promocional son capas distintas y coexistentes.

## Modelo logico final

### `RegisterBetsBatch`

```ts
type RegisterBetsBatch = {
  idempotencyKey?: string,
  strategy: StrategyContext,
  calculation: CalculationContext,
  bets: BetLegInput[]
}
```

### `StrategyContext`

```ts
type StrategyContext =
  | { kind: 'NONE' }
  | {
      kind: 'HEDGE',
      strategyType: 'MATCHED_BETTING' | 'DUTCHING',
      lineMode: 'SINGLE' | 'COMBINED_2' | 'COMBINED_3',
      mode?: 'STANDARD' | 'UNDERLAY' | 'OVERLAY',
      dutchingOptionsCount?: 2 | 3,
      hedgeAdjustmentType: 'NONE' | 'UNMATCHED' | 'PREPAYMENT'
    }
```

Reglas:
1. `kind=NONE` => exactamente 1 leg.
2. `kind=HEDGE` => 2..4 legs, con `legRole` unico por batch.
3. `legRole` define rol estrategico, no promocional.

### `CalculationContext`

```ts
type ScenarioId = /* enum cerrado en shared (41 escenarios actuales) */

type CalculationTarget = {
  participationKey: string
}

type CalculationContext = {
  scenarioId: ScenarioId,
  target?: CalculationTarget
}
```

Reglas:
1. `scenarioId` lo resuelve frontend y lo envia siempre.
2. Backend no resuelve escenario; solo valida pertenencia + coherencia.
3. Si el batch tiene participaciones promocionales, `target` es obligatorio.
4. `target` debe apuntar a una participacion existente del payload.
5. El `target` define que contexto promocional gobierna el calculo reactivo cuando hay multiples promociones en el mismo batch.

### `BetLegInput`

```ts
type BetLegInput = {
  bookmaker: Bookmaker,
  betEvent: BetEvent,
  stake: number,
  odds: number,
  commission: number,
  status?: BetStatus,
  risk?: number | null,
  profit?: number | null,
  liability?: number | null,
  placedAt: Date,
  settledAt?: Date | null,

  legRole?: 'MAIN' | 'HEDGE1' | 'HEDGE2' | 'HEDGE3',
  legOrder: number,

  participations: PromotionParticipationInput[]
}
```

### `PromotionParticipationInput`

```ts
type PromotionParticipationInput =
  | {
      participationKey: string,
      kind: 'QUALIFY_TRACKING',
      promotionId: string,
      phaseId?: string,
      qualifyConditionId: string,
      rewardIds: string[],
      calculationRewardId: string,
      rewardType: RewardType,
      contributesToTracking: boolean
    }
  | {
      participationKey: string,
      kind: 'REWARD_USAGE',
      promotionId: string,
      phaseId?: string,
      rewardId: string,
      rewardType: RewardType,
      usageTrackingId: string,
      contributesToTracking: boolean
    }
```

Notas:
1. No existe `promotion.kind=NONE` a nivel batch: standalone se expresa con `participations=[]` en todas las legs.
2. `rewardType` se muestra en frontend como read-only y se persiste como snapshot.
3. En `QUALIFY_TRACKING`, `rewardType` se deriva de `calculationRewardId`.
4. En `REWARD_USAGE`, `rewardType` se deriva de `rewardId`.
5. Contrato final: `participations` se envia siempre como array (usar `[]` cuando la leg no participa en promociones).

## Persistencia objetivo

### Tabla `bet_registration_batches`
Campos:
1. `id`
2. `userId`
3. `strategyKind`
4. `strategyType?`
5. `lineMode?`
6. `mode?`
7. `dutchingOptionsCount?`
8. `hedgeAdjustmentType?`
9. `scenarioId`
10. `calculationParticipationKey?`
11. `idempotencyKey?`
12. `createdAt`
13. `updatedAt`

### Tabla `bets`
1. Core de apuesta.
2. `batchId` (FK).
3. `legRole?`.
4. `legOrder`.

### Tabla `bet_participations`
1. `id`
2. `batchId` (FK)
3. `betId` (FK)
4. `kind` (`QUALIFY_TRACKING | REWARD_USAGE`)
5. `participationKey`
6. `promotionId`
7. `phaseId?`
8. `qualifyConditionId?`
9. `usageTrackingId?`
10. `rewardIds?` (solo `QUALIFY_TRACKING`)
11. `calculationRewardId?` (solo `QUALIFY_TRACKING`)
12. `rewardId?` (solo `REWARD_USAGE`)
13. `rewardType`
14. `contributesToTracking`
15. Campos de contribucion (`stakeAmount`, `rolloverContribution`, `progressAfter`)
16. `createdAt`
17. `updatedAt`

## Reglas de negocio cerradas
1. Todo alta entra por `registerBetsBatch`.
2. `strategy.kind=NONE` => 1 leg, sin configuracion hedge.
3. Matriz cerrada de `strategy.kind=HEDGE`:
- Campos base obligatorios: `strategyType`, `lineMode`, `hedgeAdjustmentType`.
- `strategyType=MATCHED_BETTING`:
  - `lineMode=SINGLE` => `mode` obligatorio (`STANDARD|UNDERLAY|OVERLAY`), `dutchingOptionsCount=NULL`.
  - `lineMode=COMBINED_2|COMBINED_3` => `mode=STANDARD`, `dutchingOptionsCount=NULL`.
- `strategyType=DUTCHING`:
  - `lineMode=SINGLE` => `mode` obligatorio (`STANDARD|UNDERLAY|OVERLAY`) y `dutchingOptionsCount` obligatorio (`2|3`).
  - `lineMode=COMBINED_2|COMBINED_3` => `mode=STANDARD`, `dutchingOptionsCount=NULL`.
4. Cardinalidad exacta de legs por escenario:
- se valida contra `scenarioId` (catalogo cerrado en shared).
- helper obligatorio compartido: `validateLegShapeByScenario(scenarioId, bets[])`.
5. Una leg puede tener 0..N participaciones.
6. Un batch puede mezclar promociones distintas entre legs.
7. Una misma leg puede participar en multiples promociones simultaneamente.
8. Una misma leg puede ser `HEDGE1` estrategicamente y, a la vez, `contributesToTracking=true` en una o varias participaciones promocionales.
9. Registrar/cambiar apuestas recalcula tracking pero no cambia estados manuales de QC/reward.
10. Para cada objetivo de tracking presente en el batch (`qualifyConditionId` o `usageTrackingId`), debe existir exactamente una participacion con `contributesToTracking=true`.

## Integridad referencial y constraints
1. `FK bets.batchId -> bet_registration_batches.id`.
2. `FK bet_registration_batches.userId -> users.id`.
3. `FK bet_participations.betId -> bets.id`.
4. `FK bet_participations.batchId -> bet_registration_batches.id`.
5. `bet_participations.batchId` debe coincidir con `bets.batchId`.
6. `UNIQUE (bets.batchId, legRole)` cuando `legRole IS NOT NULL`.
7. `UNIQUE (bets.batchId, legOrder)`.
8. `UNIQUE (bet_participations.batchId, participationKey)`.
9. CHECK por tipo de participacion:
- `QUALIFY_TRACKING` => `qualifyConditionId NOT NULL`, `usageTrackingId NULL`, `rewardId NULL`, `rewardIds NOT NULL`, `calculationRewardId NOT NULL`, `rewardType NOT NULL`.
- `REWARD_USAGE` => `usageTrackingId NOT NULL`, `qualifyConditionId NULL`, `rewardId NOT NULL`, `rewardIds NULL`, `calculationRewardId NULL`, `rewardType NOT NULL`.
10. Anti-duplicado por leg+objetivo (aunque `contributesToTracking=false`):
- `UNIQUE(betId, kind, qualifyConditionId)` para `kind='QUALIFY_TRACKING'`.
- `UNIQUE(betId, kind, usageTrackingId)` para `kind='REWARD_USAGE'`.
11. Unicidad de leg contribuyente por objetivo dentro del batch:
- indice parcial unico para `QUALIFY_TRACKING`: `UNIQUE(batchId, qualifyConditionId) WHERE kind='QUALIFY_TRACKING' AND contributesToTracking=true`.
- indice parcial unico para `REWARD_USAGE`: `UNIQUE(batchId, usageTrackingId) WHERE kind='REWARD_USAGE' AND contributesToTracking=true`.
12. Idempotencia:
- `UNIQUE(userId, idempotencyKey) WHERE idempotencyKey IS NOT NULL`.
13. Consistencia de snapshot:
- `rewardType` debe coincidir con reward padre (`calculationRewardId` o `rewardId`).
14. Consistencia jerarquica (servicio transaccional):
- `phase` pertenece a `promotion`.
- `qualifyCondition` pertenece a `promotion`.
- `usageTracking` pertenece a `reward`.
- en `QUALIFY_TRACKING`, `calculationRewardId` pertenece a `rewardIds`.
- en `QUALIFY_TRACKING`, todos los `rewardIds` pertenecen a `promotion` y, si aplica, a `phase`.
15. Normalizacion `rewardIds`:
- deduplicar y ordenar antes de persistir.
16. `rewardType` es obligatorio en ambos tipos de participacion y se valida contra la reward de referencia.
17. Indices para consultas por rewards en QC multi-reward:
- si DB soporta arrays (p. ej. Postgres), crear indice GIN sobre `bet_participations.rewardIds`.
- si no hay soporte adecuado, usar tabla relacional `bet_participation_rewards` como via recomendada.

## Ejemplo complejo valido (tu caso)
1. Leg 1 (`MAIN`) participa en `REWARD_USAGE` de freebet (`usageTrackingId=usage_freebet_1`, `contributesToTracking=true`).
2. Leg 2 (`HEDGE1`) participa en:
- la misma `REWARD_USAGE` de freebet (`contributesToTracking=false`),
- una `REWARD_USAGE` de enhanced odds (`usageTrackingId=usage_enhanced_1`, `contributesToTracking=true`),
- otra `REWARD_USAGE` de bono rollover (`usageTrackingId=usage_bonus_1`, `contributesToTracking=true`),
- y opcionalmente una `QUALIFY_TRACKING` para liberar una freebet (`qualifyConditionId=qc_1`, `contributesToTracking=true`).
3. `calculation.target` apunta a la participacion que gobierna el escenario activo del formulario.

## Calculo reactivo (criterio final)
El motor consume:
1. `legs[]` (odds, stake, commission, estados, etc.).
2. `strategyContext`.
3. Participacion objetivo (`calculation.target`) y su contexto promocional.
4. `scenarioId` (enum cerrado).

Reglas:
1. `contributesToTracking` afecta tracking/agregados, no la matematica base de hedge por si solo.
2. La formula se selecciona por `strategyContext + contexto promocional del target`.

## Recomendaciones incorporadas
1. [x] Persistir `rewardType` como snapshot para filtros/historico.
2. [x] Resolver `scenarioId` en frontend; backend solo valida coherencia.

## Plan de implementacion

### Fase 1 - Shared
1. Refactor `bet.schema.ts` al contrato batch + legs + participations.
2. Separar `StrategyContextSchema`, `CalculationContextSchema`, `PromotionParticipationSchema`.
3. Incluir `idempotencyKey` en comando de entrada.
4. Validaciones cruzadas:
- matrix de estrategia,
- target de calculo existente,
- coherencia de escenario,
- cardinalidades por objetivo de tracking.

### Fase 2 - Prisma
1. Ajustar `bet_registration_batches` quitando contexto promocional global.
2. Ajustar `bets` (`batchId`, `legRole`, `legOrder`).
3. Ajustar `bet_participations` para contexto promo por leg.
4. Crear indices parciales de contribucion por objetivo (`qualifyConditionId` / `usageTrackingId`).
5. Crear constraints anti-duplicado por leg+objetivo:
- `UNIQUE(betId, kind, qualifyConditionId)` para `QUALIFY_TRACKING`.
- `UNIQUE(betId, kind, usageTrackingId)` para `REWARD_USAGE`.
6. Incluir `rewardType NOT NULL` en el modelo y CHECKs por tipo de participacion.
7. Aplicar constraints de idempotencia.
8. Crear indice para `rewardIds` (GIN en Postgres) o planificar `bet_participation_rewards` si el motor no soporta ese patron eficientemente.

### Fase 3 - Backend
1. `registerBetsBatch` en transaccion unica.
2. Persistir batch + bets + participations.
3. Validar `scenarioId` y `calculation.target`.
4. Recalcular tracking contextual sin mutar estados manuales.

### Fase 4 - Frontend
1. Formulario batch unico.
2. Subformularios de participaciones por leg.
3. Selector de participacion objetivo para calculo.
4. Recalculo reactivo por `legs + strategy + targetPromotionContext`.

## Testing minimo requerido
1. Schema:
- standalone (`participations=[]`) valido.
- `participations` ausente en una leg invalido.
- leg con multiples participaciones valido.
- batch con mezclas QC + usage entre legs valido.
- target de calculo inexistente invalido.
- target de calculo que no corresponde a ninguna `participationKey` del payload invalido.
- `calculationRewardId` fuera de `rewardIds` invalido.
- mas de una leg `true` para mismo `(batchId, qualifyConditionId)` invalido.
- mas de una leg `true` para mismo `(batchId, usageTrackingId)` invalido.
- objetivo presente sin ninguna participacion `contributesToTracking=true` invalido.
- `participationKey` duplicado en el mismo batch invalido.
- participacion duplicada por misma leg+objetivo (`betId/kind/qualifyConditionId` o `betId/kind/usageTrackingId`) invalido.
2. Integracion:
- idempotencia real.
- listados por reward/QC/usage con participaciones multiples por leg.
3. Lecturas:
- agrupacion por `batchId` + `legOrder`.
- trazabilidad de una leg en multiples promociones.

## Criterio de aceptacion final
1. Soporta standalone, QC y reward usage en un mismo modelo.
2. Soporta que una leg participe en multiples promociones simultaneamente.
3. Mantiene separacion clara entre rol estrategico (`legRole`) y rol promocional (`participation`).
4. Mantiene calculo reactivo deterministico con `scenarioId` + `calculation.target`.
5. Permite listados complejos sin ambiguedad semantica.

## Auditoria final independiente
Veredicto: APTO para implementar contratos en `shared`.

Riesgo residual controlado:
1. `rewardIds` array sigue sin FK por elemento a nivel SQL estandar; se cubre en servicio transaccional.
2. Si se busca FK estricta por reward en QC, evolucion natural: tabla relacional `bet_participation_rewards`.
