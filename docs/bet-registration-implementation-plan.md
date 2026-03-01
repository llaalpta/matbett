# Re-evaluación del plan v4 + Planificación completa de funcionalidad de apuestas

## Contexto del dominio

El sistema registra apuestas en contexto de matched betting / arbitraje donde:
- Una apuesta (leg) puede participar en **múltiples promociones** simultáneamente.
- La **misma leg** puede ser HEDGE1 estratégicamente para la primera línea y, a la vez,
  ser la apuesta "principal" promocionalmente en su propia casa (usa enhanced odds,
  contribuye al rollover, califica para una freebet, etc.).
- `legRole` (MAIN/HEDGE1/…) es la posición **matemática** en la fórmula de cobertura
  (quién aporta stake como input, a quién se le calcula el stake). Es invariante
  respecto a las promociones.
- El **rol promocional** es ortogonal: vive en `participations[]` por leg y describe
  qué papel juega cada apuesta en cada promoción (tracking de QC o tracking de uso).
- El cálculo reactivo se gobierna por la participación-objetivo (`calculation.target`).
  Durante la creación, el frontend usa un `participationKey` efímero para referenciarla.
  Una vez persistido, el backend resuelve el key al `bet_participation.id` real (UUID)
  y almacena `calculationParticipationId` (FK) en el batch.
- Los **datos del evento** (nombre, mercado, opciones, fecha) viven a nivel de BATCH
  como array JSON. En apuestas simples hay 1 evento; en combinadas 2 o 3.
  Cada leg referencia qué evento(s) cubre vía `selections[]` (array unificado de BetSelection).
- Los campos `profit`, `risk`, `yield` se calculan en frontend para cada leg Y para
  el batch (agregados). El backend solo computa agregados a nivel de tracking superior
  (QC, UsageTracking, Reward, Promotion).
- Los **estados de apuesta son manuales** — el usuario cambia el status con timestamp.
  Cada cambio de estado dispara recálculo de tracking en backend.

## 1. Re-evaluación de la auditoría anterior

### Hallazgos DESCARTADOS (son diferencias esperadas plan→código actual)
| ID anterior | Motivo de descarte |
|-------------|-------------------|
| F01 | La separación `strategy` + `calculation` ES el refactor. Normal que no coincida. |
| F02 | Mover contexto de batch-level a per-leg ES el cambio arquitectónico principal. |
| F04 | El nuevo modelo de participación ES lo que se va a implementar. |
| F05 | `bet_registration_batches` se creará en Fase 2. |
| F06 | `legOrder` se añadirá en Fase 1. |
| F07 | `idempotencyKey` — ya no se incluye (decisión posterior: eliminado). |
| F09 | El re-nesting de `StrategyContext` con `kind` discriminator es intencional. |
| F13 | Renaming `role`→`kind` en participaciones es parte del refactor. |
| F14 | Constraints se crearán en Fase 2. |

### Hallazgos VÁLIDOS que requieren acción

**H1 — `scenarioId`: catálogo cerrado aún no definido (BLOQUEO FASE 1)**
- El plan referencia `ScenarioId` como enum cerrado de 41 escenarios.
- Existen 41 funciones en `docs/legacy/calculate.ts` con naming pattern:
  `{lineMode}_{strategy}_{mode}_{promoAction}_{hedgeAdjust?}`
- **Acción:** Derivar enum `ScenarioId` de los 41 nombres actuales antes de codificar shared.
- Ejemplo: `SIMPLE_MB_STANDARD_NO_PROMO`, `COMBINED_2_DUTCHING_STANDARD_USE_FREEBET`, etc.

**H2 — `enhancedOdds`: simplificado a originalOdds**
- Schema simplificado: `enhancedOdds?: { originalOdds: number }`.
- **Rediseño:** Enhanced odds SÍ es una promoción en DB (rewardType=ENHANCED_ODDS).
  La UX es simplificada: toggle que auto-genera participación REWARD_USAGE.
- `odds` de la leg = cuota efectiva (mejorada). `enhancedOdds.originalOdds` = cuota sin mejora.
- `refundValue`, `retentionRate`, `isSnr` NO están en la bet — viven en la reward.
  El frontend los lee de la reward para alimentar el motor de cálculo.

**H3 — Datos del evento: reestructurado a nivel de batch**
- Los datos del evento (eventName, marketName, eventOptions, eventDate?) son COMUNES
  a todas las legs del batch. Viven en `batch.events[]` como JSON array.
- En SINGLE: 1 evento. En COMBINED_2: 2. En COMBINED_3: 3.
- Cada leg tiene `selections[]` (array de BetSelection, cada una con eventIndex + selection).
- **Acción:** Documentar `BatchEventSchema` en el plan (ya hecho en §1.5).

**H4 — `promoActionType` se elimina del batch: derivación documentada**
- Se deriva de la **participación objetivo** (la que `calculation.target` referencia):
  - Si `target` es `null` (sin participaciones, o sin target): `promoAction = NO_PROMO`
  - Si la participación objetivo tiene `kind = QUALIFY_TRACKING` y `rewardType = FREEBET`:
    `promoAction = GENERATE_FREEBET` (cálculo incluye refundValue + retentionRate de la reward)
  - Si la participación objetivo tiene `kind = REWARD_USAGE` y `rewardType = FREEBET` o `CASHBACK_FREEBET`:
    `promoAction = USE_FREEBET` (cálculo tiene en cuenta SNR: stake gratuito, risk=0 en main.
    Un CASHBACK_FREEBET, una vez entregado, es funcionalmente una freebet)
- **Aclaración:** Las 41 funciones solo implementan 3 promoActions (NO_PROMO, GENERATE_FREEBET,
  USE_FREEBET). Para BET_BONUS_ROLLOVER/BET_BONUS_NO_ROLLOVER/ENHANCED_ODDS
  no hay fórmula especial — se calcula como NO_PROMO
  y el rollover se trackea sin afectar la fórmula de hedge.

**H5 — `type` BACK/LAY: ELIMINADO (redundante)**
- `legRole` (MAIN/HEDGE1/2/3) + `strategyType` (MATCHED_BETTING/DUTCHING) determinan
  completamente si la apuesta es back o lay:
  - MATCHED_BETTING: MAIN→BACK, HEDGE*→LAY.
  - DUTCHING: todas→BACK.
  - Standalone (kind=NONE): siempre BACK (apuesta normal en bookmaker).
- **Decisión:** `type` no se incluye en `BetLegInput`, no se persiste en Prisma.
  Si se necesita para queries o display, se deriva con un getter/computed:
  `getType(legRole, strategyType) → BACK | LAY`.
- Eliminar `type` del modelo Prisma `Bet` actual en la migración.

**H6 — `rewardIds[]` storage: decisión cerrada**
- **Decisión:** Prisma `String[]` (mapea a Postgres native array `TEXT[]`).
  No JSON. Prisma tiene soporte nativo: `has`, `hasEvery`, `hasSome` filters.
- Crear índice GIN sobre la columna para queries eficientes.
- En Zod: `z.array(z.string().cuid2())`.
- Si en el futuro se necesita FK estricta, evolucionar a tabla M:N `bet_participation_rewards`.
- Integridad referencial por reward se valida en el servicio transaccional.

**H7 — Prisma no soporta nativamente CHECK/partial indexes/GIN**
- Se necesitan migraciones SQL manuales post-Prisma para constraints avanzados.
- **Acción:** En Fase 2, usar `prisma migrate dev --create-only` + editar SQL manualmente
  para añadir CHECKs, partial unique indexes y GIN. Documentar en archivo separado.

**H8 — `hedgeGroupId`/`parentBetId` legacy en Prisma `Bet`**
- El plan usa `batchId` FK. Los campos legacy deben eliminarse.
- **Acción:** En la migración de Fase 2, eliminar `hedgeGroupId`, `parentBetId`
  y la self-relation `HedgeBets`. Reemplazar por `batchId` FK.

## 2. Validación de la arquitectura del plan v4

### ✅ El plan modela correctamente:
1. **Multi-promo per leg** — `participations[]` por leg permite N participaciones.
2. **Rol estratégico ≠ rol promocional** — `legRole` (math) vs `participation.kind` (promo).
3. **Hedge recíproco** — Leg HEDGE1 puede ser "principal" promocionalmente en su bookmaker,
   con múltiples `participations` (REWARD_USAGE rollover + QUALIFY_TRACKING para liberar
   freebet), sin conflicto con su `legRole=HEDGE1`.
4. **Standalone** — NO es un tipo de apuesta. Es un **punto de entrada** (formulario
   sin contexto de promo). Puede tener hedge y/o participaciones como cualquier batch.
5. **Target de cálculo** — `calculation.target` señala qué participación gobierna la fórmula.
6. **Tracking sin mutar estados** — Registrar/cambiar bets recalcula métricas, no estados.

### ✅ Aclaración: `legRole` vs rol promocional — NO es lo mismo

**`legRole`** (MAIN/HEDGE1/HEDGE2/HEDGE3) es la posición **matemática** en la fórmula
de cobertura. Es **invariante** — una leg es HEDGE1 en el batch y punto. No cambia según
la promoción.

**El rol promocional** se expresa a través de `participations[]`. No existe un campo
"en esta promo soy main, en esta otra soy hedge". Lo que existe es:
- `participation.kind = QUALIFY_TRACKING` → "esta apuesta contribuye a calificar en la promo X"
- `participation.kind = REWARD_USAGE` → "esta apuesta usa una reward de la promo Y"

**Ejemplo:** Leg con `legRole=HEDGE1` (es la cobertura matemática), pero:
- Participación 1: REWARD_USAGE en promo A → usa freebet del bookmaker de esta leg
- Participación 2: REWARD_USAGE en promo B → contribuye al rollover de un bono
- Participación 3: QUALIFY_TRACKING en promo C → califica para liberar una freebet

Ninguna de estas participaciones dice "soy main" o "soy hedge". El `legRole` es ortogonal.
En el formulario, el usuario simplemente:
1. Ve los subformularios de legs según la estrategia (MAIN, HEDGE1, etc.)
2. En cada leg, añade 0..N participaciones con selector de promo/reward/QC
3. Cada participación tiene `kind` (QT o RU) y los campos específicos
4. No necesita indicar "en esta promo soy main" — no existe ese concepto

### ✅ Aclaración: Enhanced Odds — flag UX, pero SÍ es promoción en DB

**Enhanced Odds ES una promoción a nivel de persistencia** (existe en Prisma como
promotion → reward con rewardType=ENHANCED_ODDS). Lo que cambia es la UX:

**Cómo funciona en el formulario (UX simplificada):**
1. Cada leg tiene un toggle/switch: "Cuota mejorada" (desactivado por defecto).
2. Al activar el toggle:
   - Aparecen campos adicionales: `originalOdds` (la cuota sin mejora).
   - El campo `odds` principal pasa a ser la cuota mejorada (la que realmente se usa).
   - Se añade **automáticamente** una participación al array `participations[]` de esa leg:
     `{ kind: 'REWARD_USAGE', rewardType: 'ENHANCED_ODDS', ... }`.
   - El usuario selecciona a qué promoción/reward de enhanced odds corresponde
     (puede haber varias activas en ese bookmaker).
3. El motor de cálculo usa `odds` (la mejorada) para todos los cálculos.

**Persistencia dual:**
- **En el bet:** `enhancedOdds: { originalOdds }` como `Json?`.
  Dato de referencia rápida (cuota original vs mejorada).
- **En participations:** Una entrada REWARD_USAGE con rewardType=ENHANCED_ODDS
  que vincula la apuesta con la promoción/reward formal.

**Resumen:** La promoción existe en DB. El toggle es un atajo UX que:
1. Muestra los campos de odds mejorada en la leg.
2. Auto-genera la participación REWARD_USAGE al array.
3. El usuario solo escoge a qué reward de enhanced odds vincularla.

**Schema:**
```
BetLegInput {
  odds: number,                    // Cuota efectiva (mejorada si enhanced, normal si no)
  enhancedOdds?: {
    originalOdds: number,          // Cuota original sin mejora
  }
  participations: [                // Si enhanced odds activo, incluye automáticamente:
    { kind: 'REWARD_USAGE', rewardType: 'ENHANCED_ODDS', rewardId: '...', ... }
  ]
}
```

**Persistencia Prisma:** `enhancedOdds Json?` en `Bet`. Filtrable en listados.

**Campos de la reward (NO en la bet):**
- `refundValue` (valor de la reward, ej: 5€ freebet)
- `retentionRate` (% esperado de conversión al usar freebets en matched betting)
- `isSnr` (Stake Not Returned: si la freebet no devuelve el stake)
El frontend los lee de la reward vía API para alimentar el motor de cálculo.

### ✅ Confirmado: `hedgeAdjustmentType` SOLO en edición (flujo real)
- **UNMATCHED:** La lay bet en la exchange no se iguala completamente (falta de liquidez).
  El usuario indica cuánto se igualó y la nueva cuota → aparece un HEDGE2 adicional.
  Topología: 2 legs → 3 legs.
  **Aplica SOLO a: MB + SINGLE.** Es un concepto de exchange (lay bet). No existe en dutching
  ni en combinadas.
- **PREPAYMENT:** El bookmaker da la back bet por ganada anticipadamente. La lay bet
  queda viva. El usuario hace una nueva back bet a cuota actual → tercera línea.
  Topología: 2 legs → 3 legs.
  **Aplica a: MB + SINGLE y DUTCHING + SINGLE.** En ambos casos, el bookmaker puede pagar
  anticipadamente una apuesta simple. No aplica a combinadas.
- **Regla de aplicabilidad:**
  - `hedgeAdjustmentType` SOLO se permite si `lineMode = SINGLE`.
  - Combinadas (COMBINED_2/3) NO admiten ajustes. Ya nacen con 3-4 legs y su topología
    es fija: cada hedge cubre una selección de la combinada, no hay concepto de "lay no
    igualada" ni "pago anticipado parcial" para combinadas.
  - Validación en superRefine + CHECK SQL.
- **Flujo real:** El ajuste NO se ofrece en la creación inicial del batch, sino
  SOLO al editar un batch ya registrado. Esto replica el flujo del mundo real:
  1. El usuario registra su batch (MAIN + HEDGE1) con 2 legs.
  2. Algo ocurre después (la lay no se iguala, el bookmaker paga anticipadamente).
  3. El usuario abre el batch en modo edición.
  4. Selecciona `hedgeAdjustmentType` = UNMATCHED o PREPAYMENT.
  5. Aparece el formulario de la nueva leg (HEDGE2).
  6. Al guardar → `updateBatch` con el batch completo (nueva leg incluida + scenarioId actualizado).
  7. Las legs existentes (MAIN + HEDGE1) conservan sus IDs y participaciones.
- **El registro inicial es siempre sin adjustment:** `hedgeAdjustmentType` queda NULL
  (ausente, sin adjustment). El campo ni se muestra en el formulario de creación.

## 3. Plan de implementación completo

### Fase 0 — Prerrequisitos (antes de codificar)

#### 0.1 Catálogo ScenarioId
- Derivar 41 valores de enum de los nombres de funciones en `docs/legacy/calculate.ts`.
- Definir convención de naming: `SIMPLE_MB_STD_NO_PROMO`, etc.
- Crear helper `getScenarioId(config) → ScenarioId` que mapea la configuración
  del formulario (strategy + context) al escenario correspondiente.
- Crear helper `validateLegShapeByScenario(scenarioId, legs[])` que valida
  cardinalidad y roles de legs por escenario.

#### 0.2 Decisiones de diseño cerradas
- `type` BACK/LAY: **ELIMINADO**. 100% derivable de `legRole` + `strategyType`. No input, no persistido. (H5)
- `rewardIds[]`: Prisma `String[]` (Postgres native array) + GIN index. (H6)
- `promoActionType`: derivado de `calculation.target`. (H4)
- `hedgeAdjustmentType`: en `StrategyContext` pero **SOLO disponible en edición**,
  nunca en creación inicial. El registro siempre es `hedgeAdjustmentType=NULL` (sin adjustment).
- `enhancedOdds`: flag UX por leg + participación auto-generada REWARD_USAGE.
  SÍ es promoción en DB, pero UX simplificada con toggle. (H2, ver sección 2b)

### Fase 1 — Shared (schemas + tipos)

#### 1.1 Nuevo `StrategyContextSchema`
```
type StrategyContext =
  | { kind: 'NONE' }
  | { kind: 'HEDGE', strategyType, lineMode, mode, dutchingOptionsCount?,
      hedgeAdjustmentType? }
```
- `strategyType`: `'MATCHED_BETTING' | 'DUTCHING'` — requerido solo si kind=HEDGE.
- `mode`: `'STANDARD' | 'OVERLAY' | 'UNDERLAY'` — OBLIGATORIO para HEDGE.
  Para combinadas se fuerza STANDARD (superRefine). Para SINGLE, libre elección.
- `hedgeAdjustmentType` es optional. En la creación NO se envía (NULL en DB = sin adjustment).
  Solo se establece al editar un batch: `UNMATCHED` o `PREPAYMENT` (los únicos valores válidos).
- **Mapping desde schema actual:** `HedgeTypeSchema` tiene `NONE | MATCHED_BETTING | DUTCHING`.
  Se reestructura: `NONE` → `kind: 'NONE'`; `MATCHED_BETTING/DUTCHING` → `kind: 'HEDGE'`
  con `strategyType = 'MATCHED_BETTING' | 'DUTCHING'`. `HedgeTypeSchema` se elimina.
- Reemplaza la parte estratégica de `HedgeCalculationConfigSchema`.
- Eliminar `promoActionType`, `rewardType`, `calculationFunctionId` del config.

#### 1.2 Nuevo `CalculationContextSchema`

**Contratos separados creación vs edición:**
```
// CREACIÓN — target usa clave efímera que el backend resuelve a UUID
type CreateCalculationContext = {
  scenarioId?: ScenarioId,
  target?: { participationKey: string }
}

// EDICIÓN — target usa UUID real O clave efímera (si apunta a leg nueva del mismo input)
type UpdateCalculationContext = {
  scenarioId?: ScenarioId,
  target?: { participationId?: string, participationKey?: string }
  // Exactamente uno de participationId o participationKey debe estar presente en target.
}
```
- `scenarioId` como `z.enum(...)` con los 41 valores. **OPCIONAL:**
  - Requerido si `strategy.kind=HEDGE` (hay cálculo de hedge → necesita función).
  - Null/undefined si `strategy.kind=NONE` (no hay fórmula de cobertura que invocar).
  - SuperRefine valida esta regla.
- `scenarioId` se DERIVA automáticamente de la configuración del formulario, NO se
  selecciona manualmente. El frontend lo calcula a partir de: strategyType + lineMode +
  mode + dutchingOptionsCount + hedgeAdjustmentType + promoAction del target.
  Helper: `getScenarioId(config) → ScenarioId`.
- **Regla de UX:** el formulario NO debe permitir seleccionar combinaciones que no
  estén respaldadas por el catálogo real de `ScenarioId`. La navegación es secuencial:
  cada paso filtra las opciones visibles del siguiente (ej: COMBINED fuerza
  `mode=STANDARD`; DUTCHING + THREE_OPTIONS no debe mostrar adjustments que no tengan fórmula).
- **Helpers compartidos requeridos para frontend:** `getAvailableScenarioOptions(...)`,
  `getCompatibleScenarios(...)`, `isScenarioSupported(...)`. El frontend los usa para
  decidir qué opciones renderizar; el schema solo actúa como defensa en profundidad.
- `target` obligatorio si `strategy.kind=HEDGE` Y hay participaciones en el batch.
  Para NONE, target es siempre undefined.

**En creación:** `target.participationKey` es un string **efímero** generado por el frontend
  (puede ser un simple auto-increment `"p1"`, `"p2"`, o cualquier string único
  dentro del batch). Su ÚNICO propósito es referenciar la participación objetivo
  dentro del mismo input de creación.
- **Persistencia:** El backend resuelve `target.participationKey` al ID real (UUID)
  de la `bet_participation` creada y almacena `calculationParticipationId` (FK) en
  `bet_registration_batches`. `participationKey` NO se persiste.
  `scenarioId` se persiste como `scenarioId` (String?, null para NONE).

**En edición:** `target.participationId` es el UUID real de una `bet_participation`
  existente en DB. O `target.participationKey` si apunta a una participación nueva
  del input (ya sea en una leg nueva sin `betId` o en una leg existente con `betId`
  que añade participaciones nuevas). El backend valida y resuelve.
  Actualiza `batch.calculationParticipationId` directamente.

#### 1.3 Nuevo `PromotionParticipationInputSchema`
- Discriminated union por `kind` (QUALIFY_TRACKING | REWARD_USAGE).
- **Campos comunes:** `participationKey`, `rewardType`, `contributesToTracking`.
- **QUALIFY_TRACKING campos:** `qualifyConditionId`, `rewardIds[]`, `calculationRewardId`
  (obligatorio: la reward en cuyo contexto se creó la participación QT; también determina
  el `promoAction` si esta participación es el target de cálculo del batch).
- **REWARD_USAGE campos:** `usageTrackingId`, `rewardId` (singular, la reward que se usa),
  `rewardIds` NO se incluye en RU (solo QT usa array de rewards).
- **Campos NO incluidos en input (derivados en backend):**
  - `promotionId` — derivable: QT → `qualifyCondition.promotionId`; RU → `usageTracking.reward.promotionId`.
  - `phaseId` — derivable: QT → `calculationRewardId` → `reward.phaseId`; RU → `usageTracking.reward.phaseId`.
    **Nota:** `calculationRewardId` es obligatorio para QT y ya se carga en el paso de validación
    de rewardType (paso 3). Su `phaseId` es directa y no ambigua (lookup por ID, sin depender de arrays).
    **Validación de sanity (invariante de modelo):** Al derivar phaseId para QT, el servicio
    opcionalmente verifica que `qualifyCondition.rewards.every(r => r.phaseId === derivedPhaseId)`.
    Si no se cumple, falla con error interno (invariante de modelo de promociones violada).
    Esta validación es un sanity check, no parte de la derivación.
  - Ambos se persisten como desnormalización en DB (útil para queries por promoción/fase),
    pero el servicio los deriva automáticamente de las entidades referenciadas en la transacción.
- Eliminar `countsAsAttempt`, `isSuccessful` del input (se calculan en backend).

#### 1.4 Refactor `BetLegInputSchema` (ex `BetLegCreateSchema`)

**Enums necesarios (definir en `enums.ts` o en schema compartido):**
- `LegRoleSchema = z.enum(['MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3'])`.
- `BetStatusSchema = z.enum(['PENDING', 'OPEN', 'WON', 'LOST', 'VOID', 'CASHOUT'])`.

**`BetSelectionSchema` (nuevo):**
```
BetSelection = {
  eventIndex: int,     // referencia a batch.events[eventIndex]
  selection: string,   // qué se apostó: "1", "Over 2.5", "Local"
  odds?: number        // odds individual por evento (SOLO en MAIN combinada)
}
```
- `selections` es SIEMPRE un array (unificado, reemplaza `selection` + `eventIndex` + `selections?`).
- SINGLE/NONE: 1 elemento. HEDGE en combinadas: 1 elemento. MAIN COMBINED_2: 2 elementos.
  MAIN COMBINED_3: 3 elementos.
- `odds` dentro de cada elemento es **opcional**: solo presente en MAIN de combinadas
  (para trackear odds individual por evento). En el resto, la odds de la leg es suficiente.

- **Campos completos del input:**
  `legRole?` (LegRole, requerido si kind=HEDGE, null si kind=NONE),
  `legOrder` (número, orden de la leg en el batch),
  `bookmakerAccountId` (FK a BookmakerAccount),
  `selections` (BetSelection[], qué se apostó en qué evento/s — siempre array, min 1),
  `stake` (monto apostado), `odds` (cuota decimal efectiva — mejorada si enhanced,
  para MAIN combinada = producto de odds individuales),
  `commission?` (porcentaje de comisión de la exchange, ej: 2 para 2%, default funcional:
  2 en legs de exchange/cobertura y 0 en el resto),
  `profit` (beneficio estimado, calculado por frontend),
  `risk` (riesgo/pérdida potencial, calculado por frontend),
  `yield` (rendimiento %, calculado por frontend: profit / |risk| * 100),
  `status?` (BetStatus, default PENDING),
  `placedAt?` (timestamp, default now),
  `settledAt?` (timestamp de liquidación, null hasta que la apuesta se resuelve),
  `enhancedOdds?` ({ originalOdds: number }),
  `participations: PromotionParticipationInput[]` (0..N participaciones promocionales).
- **Enhanced odds simplificado:** `odds` = cuota efectiva (mejorada si hay enhanced).
  `enhancedOdds.originalOdds` = cuota original sin mejora. Cálculos siempre usan `odds`.
  `refundValue`, `retentionRate`, `isSnr` NO están en la bet — viven en la reward.
  El frontend los lee de la reward para alimentar el motor de cálculo.
- **Selections unificado (ejemplos):**
  ```
  // MAIN combinada (COMBINED_2): 2 elementos con odds individual
  selections: [
    { eventIndex: 0, selection: "1", odds: 2.3 },
    { eventIndex: 1, selection: "Over 2.5", odds: 2.4 }
  ]
  odds: 5.52  // cuota combinada = producto de odds individuales

  // MAIN/HEDGE simple, HEDGE en combinada: 1 elemento, sin odds individual
  selections: [
    { eventIndex: 0, selection: "Over 2.5" }
  ]
  odds: 2.4   // cuota directa
  ```
- **Validaciones de `selections`:**
  - `selections.length >= 1` siempre.
  - MAIN de combinada: `selections.length === events.length` (cubre todos los eventos).
  - HEDGE en combinada: `selections.length === 1` (cubre 1 evento).
  - SINGLE/NONE: `selections.length === 1`.
  - Cada `selections[i].eventIndex` debe ser válido dentro de `events[]`.
  - MAIN combinada: `selections[i].odds` requerido para cada elemento.
  - No-MAIN o no-combinada: `selections[i].odds` debe ser undefined (evitar redundancia).
- **Comisión:** Solo aplica a exchanges (Betfair). Por defecto 0 en bookmakers.
  Cada leg tiene su propia comisión (son apuestas independientes en distintos sitios).
- NO incluir `type` (BACK/LAY) — derivable, no es input.

#### 1.5 Refactor `RegisterBetsBatchSchema`
```
{ strategy: StrategyContext, calculation: CreateCalculationContext,
  events: z.array(BatchEventSchema).min(1).max(3),
  legs: z.array(BetLegInputSchema).min(1),
  profit: z.number(), risk: z.number(), yield: z.number() }
```

**BatchEventSchema** (nuevo, vive a nivel de batch):
```
BatchEvent = {
  eventName: string,   // "Real Madrid vs Barcelona"
  marketName: string,  // "Match Winner", "Over/Under 2.5"
  eventOptions: Options,  // TWO_OPTIONS | THREE_OPTIONS | MULTIPLE_OPTIONS
  eventDate?: Date,    // fecha del evento (opcional)
}
```
- `events.length` validada contra `lineMode`:
  - SINGLE → exactamente 1 evento.
  - COMBINED_2 → exactamente 2 eventos.
  - COMBINED_3 → exactamente 3 eventos.
  - kind=NONE → exactamente 1 evento.
- MULTIPLE_OPTIONS + DUTCHING + SINGLE → RECHAZADO (solo TWO/THREE soportados).

- Eliminar `BetBatchContextSchema` (STANDALONE/QT/RU batch-level).
- Reescribir superRefine rules:
  - strategy.kind=NONE → 1 leg, `legRole` = NULL, 1 evento.
  - strategy.kind=HEDGE → cardinalidad determinada por `strategyType` + `lineMode` + `dutchingOptionsCount`:

    **MATCHED_BETTING:**
    - MB + SINGLE → 2 legs (MAIN + HEDGE1).
    - MB + COMBINED_2 → 3 legs (MAIN + HEDGE1 + HEDGE2).
    - MB + COMBINED_3 → 4 legs (MAIN + HEDGE1 + HEDGE2 + HEDGE3).

    **DUTCHING — simple (apuesta simple en un solo evento):**
    - DUTCHING + SINGLE + 2 options → 2 legs (MAIN + HEDGE1).
      Ejemplo: baloncesto, 2 resultados. Se apuesta a un resultado, se cubre el otro.
    - DUTCHING + SINGLE + 3 options → 3 legs (MAIN + HEDGE1 + HEDGE2).
      Ejemplo: fútbol 1X2, 3 resultados. Se apuesta a un resultado, se cubren los otros dos.
    - `dutchingOptionsCount` (2|3) REQUERIDO para DUTCHING + SINGLE. Determina los legs.

    **DUTCHING — combinada (parlay/acumulada en múltiples eventos):**
    - DUTCHING + COMBINED_2 → 3 legs (MAIN + HEDGE1 + HEDGE2).
      Parlay de 2 selecciones. Una hedge por cada selección de la combinada.
    - DUTCHING + COMBINED_3 → 4 legs (MAIN + HEDGE1 + HEDGE2 + HEDGE3).
      Parlay de 3 selecciones. Una hedge por cada selección, de forma secuencial
      según el orden de los partidos. Cálculo encadenado: hedge1.stake cubre MAIN,
      hedge2.stake cubre MAIN+hedge1, hedge3.stake cubre MAIN+hedge1+hedge2.
    - `dutchingOptionsCount` NO aplica para COMBINED (NULL). Los legs se derivan de lineMode.

    **Nota:** `hedgeAdjustmentType` (UNMATCHED/PREPAYMENT) NO se admite en creación.
    La leg extra de adjustment se añade vía `updateBatch` en edición.
  - Si `strategy.kind=HEDGE` y existen participations → target obligatorio y debe apuntar a
    participationKey válida. Si `strategy.kind=NONE` → target siempre undefined, scenarioId
    siempre undefined (sin cálculo de cobertura, tracking directo por participación).
  - `participationKey` único en todo el batch. Solo se usa en el input para resolver el target.
    NO se persiste en DB. El backend resuelve key → bet_participation.id real tras inserción.
  - Cada `selections[i].eventIndex` de cada leg debe ser válido dentro de `events[]`.
  - MAIN de combinada: `selections.length === events.length`, cada elemento con `odds`.
  - HEDGE en combinada: `selections.length === 1`.
  - SINGLE/NONE: `selections.length === 1`.
  - MAIN combinada: `selections[i].odds` requerido. Resto: `selections[i].odds` undefined.
  - Por cada objetivo de tracking (qualifyConditionId/usageTrackingId) dentro del batch,
    exactamente 1 participación con contributesToTracking=true. Si hay más de 1, superRefine
    rechaza. Si hay 0 para un objetivo referenciado, también rechaza (al menos 1 debe contribuir).
  - calculationRewardId obligatorio en QT y ∈ rewardIds.
  - REWARD_USAGE con rewardType=CASINO_SPINS → rechazado (no se pueden usar spins en una apuesta;
    CASINO_SPINS solo es válido en QT para calificar vía apuestas).

#### 1.5b Nuevo `UpdateBetsBatchSchema`
```
{ strategy: StrategyContext, calculation: UpdateCalculationContext,
  events: z.array(BatchEventSchema).min(1).max(3),
  legs: z.array(UpdateBetLegInputSchema).min(1),
  profit: z.number(), risk: z.number(), yield: z.number() }
```

**UpdateBetLegInputSchema** = `BetLegInputSchema.extend({ betId: z.string().uuid().optional() })`
- `betId` presente → leg existente que se actualiza.
- `betId` ausente → leg nueva que se crea.
- Legs en DB cuyo `betId` no aparece en input → se eliminan.

**UpdateCalculationContext:**
```
target?: { participationId?: string, participationKey?: string }
```
- `participationId` (UUID) → apunta a participación existente en DB. Mutuamente excluyente con `participationKey`.
- `participationKey` (efímero) → apunta a una participación nueva en el input (de cualquier leg, con o sin betId). Se resuelve igual que en creación.
- SuperRefine: exactamente uno de los dos debe estar presente si target existe.

**Nota:** `hedgeAdjustmentType` aparece en el `StrategyContext` del update. Si la leg de
adjustment no existía en la creación original, vendrá como leg sin `betId` (nueva).

**Cardinalidad en update (difiere de creación):**
La validación de superRefine de §1.5 aplica al update con DOS excepciones:
1. **Cardinalidad:** si `hedgeAdjustmentType` está presente (UNMATCHED o PREPAYMENT),
   se permite +1 leg extra respecto a la cardinalidad base.
2. **Target:** en update, `target` admite `participationId` (UUID) o `participationKey`
   (efímero), mientras que en creación solo admite `participationKey`.
Ejemplos de cardinalidad con adjustment:
- MB + SINGLE + UNMATCHED → 3 legs (MAIN + HEDGE1 + HEDGE2). Base=2, +1 adjustment.
- MB + SINGLE + PREPAYMENT → 3 legs. Idem.
- DUTCHING + SINGLE + 2opt + PREPAYMENT → 3 legs. Base=2, +1 adjustment.
- Combinadas: NO admiten hedgeAdjustmentType (CHECK #24), cardinalidad invariante.

#### 1.6 Limpieza
- Eliminar `BetBatchContextSchema`, `StandaloneBatchContextSchema`,
  `QualifyTrackingBatchContextSchema`, `RewardUsageBatchContextSchema`.
- Eliminar `HedgeCalculationConfigSchema` (reemplazado por Strategy + Calculation).
- Eliminar `HedgeTypeSchema` (reestructurado como StrategyContext.kind + strategyType).
- Eliminar enums no usados: `BetContextKindSchema`, `PromoActionTypeSchema`.
- Limpiar `hedgeAdjustmentTypeOptions` en `options.ts`: eliminar valor `'NONE'`.
  El plan usa NULL (ausencia) para "sin ajuste". Solo quedan `UNMATCHED` y `PREPAYMENT`.
  En el UI, el campo se muestra vacío/deshabilitado cuando no hay ajuste.
- Eliminar `liability` de `BetCoreFieldsSchema` (redundante con `risk`).
- Eliminar `progressAfter` de `RewardUseParticipationSchema` (derivable en lectura).
- Eliminar `BetEventSchema` actual (reemplazado por `BatchEventSchema` a nivel de batch
  + `selections[]` (BetSelection array) a nivel de leg — campo unificado).
- Actualizar re-exports en `index.ts`.

### Fase 2 — Prisma + Migraciones

#### 2.1 Crear tabla `bet_registration_batches`
- Campos: id, userId, strategyKind, strategyType?, lineMode?, mode?,
  dutchingOptionsCount?, hedgeAdjustmentType?, scenarioId?,
  calculationParticipationId? (FK → bet_participations.id),
  events (Json, array de BatchEvent), profit (Float), risk (Float), yield (Float),
  createdAt, updatedAt.
- `events`: JSON array de 1-3 objetos BatchEvent {eventName, marketName, eventOptions, eventDate?}.
  En SINGLE/NONE: 1 evento. En COMBINED_2: 2 eventos. En COMBINED_3: 3 eventos.
- `profit`, `risk`, `yield`: agregados del batch, calculados y enviados por el frontend.
  Se envían tanto en creación como en actualización (el frontend siempre los recalcula).
- `scenarioId` nullable: NULL para kind=NONE (no hay cálculo de hedge).
  Se deriva automáticamente de la configuración, NO es input directo del usuario.
- `calculationParticipationId`: FK nullable a `bet_participations.id`, **`onDelete: SetNull`**.
  El backend lo resuelve del `target.participationKey` efímero del input tras crear
  las participaciones. NULL si no hay target (kind=NONE o HEDGE sin participaciones).
  **`onDelete: SetNull`** permite que `updateBatch` elimine la leg/participación objetivo
  sin FK violation: al borrar la participación referenciada, el FK se auto-nulifica.
  El paso final del update setea el nuevo `calculationParticipationId` correcto.
- FK: userId → users.id.

#### 2.2 Modificar tabla `bets`
- Añadir: `batchId` FK NOT NULL → bet_registration_batches.id, `onDelete: Cascade`
  (todas las bets tienen batch, incluso con strategy.kind=NONE),
  `legOrder`, `enhancedOdds Json?`,
  `selections Json` NOT NULL (array de BetSelection: [{eventIndex, selection, odds?}]).
- Mantener: `userId` FK (desnormalización: el camino normalizado es batch→userId, pero
  se mantiene en bet para queries directas `WHERE userId=X` sin JOIN a batch).
- Mantener: `stake Float`, `odds Float`, `status String`, `placedAt DateTime`, `commission Float?`.
  Estos campos ya existen en el modelo actual y no requieren cambios.
- Mantener: `profit Float`, `risk Float`, `yield Float` — NOT NULL.
  Calculados por el frontend y enviados en el input (siempre presentes).
- Mantener: `settledAt DateTime?` (null hasta que la apuesta se resuelve).
- Reestructurar: `bookmaker` (String) → `bookmakerAccountId` FK → bookmaker_accounts.id.
- Eliminar: campos flat de evento (`eventName`, `marketName`, `selectionName`) — los datos
  del evento ahora viven en `batch.events[]`. Cada leg tiene `selections[]`.
- Eliminar: `selection String`, `eventIndex Int` (reemplazados por `selections Json` array unificado).
- Eliminar: `liability Float?` (redundante con `risk`).
- Eliminar: `hedgeGroupId`, `parentBetId`, self-relation `HedgeBets`.
- Eliminar: `type` (BACK/LAY) — 100% derivable, no necesita persistencia.
- Eliminar: `bookmaker` (reemplazado por bookmakerAccountId FK).
- Renombrar: `role` → `legRole` (alinear con shared).
- CHECK: `legRole IS NULL OR legRole IN ('MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3')`.
- UNIQUE(batchId, legRole) WHERE legRole IS NOT NULL.
- UNIQUE(batchId, legOrder).

#### 2.3 Modificar tabla `bet_participations`
- Renombrar: `role` → `kind`.
- Añadir: `batchId` FK → `bet_registration_batches.id`, `onDelete: Cascade`, `rewardIds String[]` (Postgres native array),
  `calculationRewardId` FK → `rewards.id`, `rewardType`, `contributesToTracking`.
  `calculationRewardId` es FK real a `rewards.id` (`onDelete: Restrict` — no se puede borrar
  una reward referenciada por participaciones activas). NOT NULL para QT (CHECK #13), NULL para RU (CHECK #9).
- **`betId` FK → bets.id, `onDelete: Cascade`:** Al eliminar una bet (leg), sus participaciones
  se eliminan en cascada. Ya existe como relación, pero debe tener `onDelete: Cascade` explícito.
- **`participationKey` NO se persiste.** Es efímero (solo en input para resolver target).
  La referencia del batch al target usa `calculationParticipationId` FK → bet_participations.id.
- **`batchId` desnormalización intencional:** El camino normalizado sería participation → bet → batch,
  pero se duplica batchId en participations para:
  1. Partial unique indexes por batch (contributesToTracking) sin JOIN.
  2. Queries directas de participaciones por batch para tracking cascade.
  3. GIN index queries filtrando por batch.
  El servicio garantiza consistencia: batchId siempre = bet.batchId de la bet padre.
- Mantener como desnormalización: `promotionId` FK, `phaseId?` FK — ya existen en el modelo
  actual. No se incluyen en el input (se derivan en el servicio), pero se persisten para
  queries eficientes por promoción/fase sin JOINs.
- Mantener para REWARD_USAGE: `stakeAmount Float?`, `rolloverContribution Float?` — snapshots
  de contribución por participación. NO son input (se computan en `recalculateTracking()`).
  `stakeAmount` = cuánto del stake de esta bet cuenta para el tracking.
  `rolloverContribution` = cuánto contribuye al rollover (puede diferir del stake por reglas
  de la promo, ej: odds < 1.5 cuentan al 50%). Útiles para audit trail per bet.
- Eliminar: `progressAfter Float?` — derivable en lectura con window function
  (`SUM(rolloverContribution) OVER (ORDER BY createdAt)`) o acumulado en aplicación.
- `rewardId` pasa de NOT NULL a NULLABLE: NULL para QUALIFY_TRACKING (usa `rewardIds[]`),
  NOT NULL para REWARD_USAGE (singular, la reward que se usa). Forzado por CHECKs #4 y #8.
- Eliminar: `countsAsAttempt`, `isSuccessful` (se calculan en servicio).
- CHECK constraints por kind.
- Partial unique indexes para contributesToTracking.
- Anti-duplicado: UNIQUE(betId, kind, qualifyConditionId), UNIQUE(betId, kind, usageTrackingId).
- GIN index sobre rewardIds.

#### 2.4 SQL manual post-migración
- CHECK constraints (Prisma no los soporta nativamente).
- Partial unique indexes con WHERE.
- GIN index.
- Documentar en `docs/bet-participations-manual-constraints.sql`.

### Fase 3 — Backend (API + Service)

#### 3.1 `IBetService` interface + `BetService`

- Crear `IBetService` en `packages/api/src/context.ts` (junto a las demás interfaces).
- Añadir `betService: IBetService` al type `Context`.
- Implementar `BetService` en `apps/backend/src/services/bet.service.ts`.
- Crear `bet.transformer.ts` en `apps/backend/src/lib/transformers/` con:
  `toBetBatchCreateInput` (incluye events JSON array),
  `toBetBatchUpdateDiff` (compara input vs DB, produce create/update/delete lists),
  `toBetCreateInput` (mapea selections[] a JSON, legRole, odds, stake, etc.),
  `toBetParticipationCreateInput` (derivación promotionId/phaseId),
  `toBetBatchEntity` (Prisma → Zod output, reconstruye legs con datos de evento).
  Registrar en `transformers/index.ts`.

**Operación de creación:** `registerBetsBatch(userId, input: RegisterBetsBatch)`
- En transacción única:
  1. Validar integridad referencial (promotion, phase, reward, QC, usageTracking,
     bookmakerAccount existen y pertenecen al usuario).
  2. Validar coherencia jerárquica (phase ∈ promotion, QC ∈ promotion, etc.).
     Incluye validación de pertenencia por participación:
     - QT: `rewardIds[]` y `calculationRewardId` deben estar en `qualifyCondition.rewards`.
     - RU: `rewardId` debe coincidir con `usageTracking.rewardId`.
  3. Validar consistencia de `rewardType` por participación:
     - QT: `rewardType` debe coincidir con `calculationRewardId.type` real en DB
       (siempre presente, es la reward de contexto de la participación).
     - RU: `rewardType` debe coincidir con `rewardId.type` real en DB.
     Si hay mismatch → error (snapshot inconsistente, probable bug de frontend).
  4. Validar scenarioId vs configuración de strategy.
  5. Si `target` existe: validar que `target.participationKey` apunta a participationKey existente en input.
  6. Validar cardinalidad de legs vs lineMode + strategyType.
  7. Validar events.length vs lineMode (SINGLE=1, COMBINED_2=2, COMBINED_3=3).
  8. Derivar campos no-input por participación: `promotionId`, `phaseId`.
  9. Crear batch → crear bets (con `batchId` del batch recién creado) → crear participations
     (con `batchId` + campos derivados).
  10. **Resolver target (si existe):** buscar la bet_participation creada cuyo input tenía
      `participationKey === target.participationKey`. Actualizar batch con
      `calculationParticipationId` = bet_participation.id real.
      Si `target` es undefined → `calculationParticipationId` queda NULL.
  11. Recalcular tracking para cada objetivo presente (sin mutar estados QC/reward).
  12. Retornar batch completo con bets, participations y tracking actualizado.

**Operación de actualización:** `updateBatch(userId, batchId, input: UpdateBetsBatch)`

El frontend SIEMPRE envía el batch COMPLETO (config + legs + participaciones + agregados).
El backend hace diff contra el estado en DB y aplica los cambios necesarios.

**Contrato `UpdateBetsBatch`:**
```
type UpdateBetsBatch = {
  strategy: StrategyContext,
  calculation: UpdateCalculationContext,   // target usa participationId O participationKey
  events: BatchEvent[],
  profit: number,                          // agregado batch recalculado por frontend
  risk: number,
  yield: number,
  legs: UpdateBetLegInput[]
}

type UpdateBetLegInput = BetLegInput & {
  betId?: string   // presente si la leg ya existía en DB, ausente si es nueva
}
```

- En transacción única:
  1. Cargar batch existente con legs y participaciones.
  2. Validar pertenencia del batch al usuario.
  3. Validar integridad referencial de TODAS las participaciones (mismas reglas que creación,
     incluyendo consistencia de `rewardType` vs reward real en DB).
  4. Validar coherencia de strategy, scenarioId, cardinalidad, events.length.
  5. **Diff de legs:**
     - Legs con `betId` que coinciden con DB → UPDATE (campos modificados).
     - Legs sin `betId` → INSERT (nuevas legs, ej: ajuste UNMATCHED/PREPAYMENT).
     - Legs en DB cuyo `betId` NO aparece en input → DELETE (cascade participations).
  6. **Diff de participaciones por leg (para legs existentes):**
     - Comparar participaciones actuales vs input por `(betId, kind, qualifyConditionId/usageTrackingId)`.
     - Nuevas → INSERT. Desaparecidas → DELETE. Cambios → UPDATE.
  7. Derivar campos no-input por participación nueva o modificada: `promotionId`, `phaseId`.
     Si una participación existente cambia de QC/usageTracking/reward, re-derivar promotionId
     y phaseId desde las nuevas entidades referenciadas.
  8. **Resolver target** (antes del UPDATE batch, para setear todo coherentemente):
     - Si `target` es undefined (strategy.kind=NONE, o HEDGE sin participaciones):
       `calculationParticipationId` = NULL.
     - Si `target.participationId` → validar que existe entre las participaciones finales
       del batch (no eliminadas). `calculationParticipationId` = participationId.
     - Si `target.participationKey` → buscar la bet_participation recién creada cuyo input
       tenía ese participationKey (aplica a participaciones nuevas de cualquier leg del input,
       tanto legs nuevas sin betId como participaciones nuevas en legs existentes con betId).
       `calculationParticipationId` = bet_participation.id real creada.
     - Cuando target está presente: exactamente uno de participationId o participationKey.
       SuperRefine lo garantiza en el schema.
  9. **UPDATE batch en un solo statement:** strategy, scenarioId, events, profit, risk, yield,
     hedgeAdjustmentType Y calculationParticipationId — todos los campos se setean
     coherentemente en un único UPDATE para respetar CHECKs SQL (ej: #6 exige que
     strategyKind='NONE' implique calculationParticipationId IS NULL).
  10. **Snapshot participaciones REWARD_USAGE:** recalcular `stakeAmount`, `rolloverContribution`.
  11. Recalcular tracking para TODOS los objetivos afectados (old ∪ new participaciones).
  12. Retornar batch actualizado completo.

**Invariantes de updateBatch:**
- **Target válido:** Si `strategy.kind=NONE` → `target` debe ser undefined, `calculationParticipationId` se
  setea a NULL. Si `strategy.kind=HEDGE` con participaciones → `target` obligatorio, debe contener
  exactamente uno de `participationId` (UUID existente) o `participationKey` (referencia a
  participación nueva en cualquier leg del input). La participación referenciada DEBE existir en
  el estado final del batch. Si el frontend elimina la leg/participación que tenía el target,
  debe reasignar target en el mismo input.
- `hedgeAdjustmentType` solo aceptable si `lineMode = SINGLE` (UNMATCHED: solo MB, PREPAYMENT: MB/DUTCHING).
- Legs existentes conservan su UUID → referencias cruzadas de otras entidades no se rompen.
- El backend NO confía ciegamente en los agregados del frontend: puede validarlos (futuro hardening).

**Operación de eliminación:** `deleteBatch(userId, batchId)`
  - En transacción:
    1. Snapshot de participaciones (objetivos afectados).
    2. Eliminar batch (cascade a bets y participations).
    3. Recalcular tracking para todos los objetivos que perdieron contribuciones.

**Ventajas del enfoque batch completo:**
- Consistencia: una sola transacción cubre TODOS los cambios.
- Simplicidad: el frontend no necesita orquestar orden de operaciones (target colgante imposible).
- El diff automático maneja todos los casos: añadir legs, quitar legs, cambiar participaciones,
  cambiar status, ajustar stakes/odds, etc. Todo en una operación.
- Los agregados (profit, risk, yield) siempre se envían actualizados con el batch completo.

#### 3.2 `BetRepository`
- `createBatch(batch, bets[], participations[])` — inserción completa.
- `findBatchById(id)` — batch con legs y participaciones incluidas.
- `findBatchesByUserId(userId, filters?)` — listado paginado.
- `updateBatch(batchId, data)` — actualiza campos del batch.
- `deleteBatch(batchId)` — cascade a bets y participations.
- `upsertBets(batchId, betsToCreate[], betsToUpdate[], betIdsToDelete[])` — diff de legs.
- `upsertParticipations(betId, toCreate[], toUpdate[], toDelete[])` — diff de participaciones.
- `getAffectedTrackingTargets(batchId)` — devuelve QCs/usageTrackings referenciados por
  cualquier participación del batch. Helper interno, usado por BetService para determinar
  qué objetivos recalcular tras updateBatch/deleteBatch. No se expone en IBetService.
- Queries por contexto: bets por QC, por reward, por usageTracking.

#### 3.3 tRPC router `betRouter`
- **Mutations (3):**
  - `registerBetsBatch` — creación completa (input: `RegisterBetsBatch`).
  - `updateBatch` — actualización completa por diff (input: `UpdateBetsBatch`).
  - `deleteBatch` — eliminación con cascade y recálculo tracking.
- **Queries (8):**
  - `getBatch` — batch completo con legs y participaciones.
  - `listBatches` — listado de batches con resumen (nº legs, profit, risk, yield),
    paginado, filtrable por strategyKind/status. Expandible para ver legs.
  - `listBets` — listado flat de apuestas, filtrable por promo/reward/QC/status/bookmaker.
    Expandible para ver legs relacionadas del mismo batch.
  - `listBetsByPromotion` — apuestas por promoción, indicando contexto (QT/RU).
    Expandible para ver batches anidados.
  - `listBetsByQC` — apuestas por qualifyCondition, filtrable por estado.
  - `listBetsByUsageTracking` — apuestas por rewardUsageTracking, filtrable por estado.
  - `getAvailablePromotionContexts(bookmakerAccountId)` — devuelve rewards con estado
    usable y QCs con tracking activo/pendiente para ese bookmaker. Usado por el frontend
    en el selector de participaciones adicionales.
  - `getDashboardTotals` — totales globales (profit, risk, yield, nº batches, etc.).
- Registrar en `appRouter` y `Context`.

#### 3.4 Tracking recalculation (extraer como servicio compartido)
- Crear `TrackingService` o función reutilizable `recalculateTracking(tx, affectedObjectiveIds[])`.
- Recibe transaction client (`tx`) para ejecutar dentro de la transacción del caller.
- Llamada desde registerBetsBatch, updateBatch y deleteBatch.
- **Tracking JSON simplificado:** La fuente de verdad de qué bets participan es
  `bet_participations` (tabla relacional). El tracking JSON solo almacena AGREGADOS
  (no `participatingBets[]`). Eliminar `UsageTrackingBetRefSchema` de los schemas de tracking.
- **Agregados por nivel de tracking:** `totalRisk`, `totalProfit`, `balance`, `yield`.
  Se computan sumando datos de las participaciones con `contributesToTracking=true`.
- Para cada `qualifyConditionId` afectado:
  1. Query bets participantes con `contributesToTracking=true` para ese QC.
  2. Agregar métricas: `totalRisk`, `totalProfit`, `balance`, `yield`.
  3. UPDATE `QC.trackingData` (JSON) con el nuevo estado agregado.
  4. UPDATE `QC.balance` si métricas cambian.
  5. **Cascada:** QC.balance → Reward.balance → Phase.totalBalance → Promotion.totalBalance.
- Para cada `usageTrackingId` afectado:
  1. Query bets participantes de uso para ese UsageTracking.
  2. Agregar métricas: `totalUsed`, `rolloverProgress`, `remainingRollover/Balance`,
     `totalRisk`, `totalProfit`, `balance`, `yield`.
  3. **UPDATE snapshots per-participación:** Para cada participación REWARD_USAGE con
     `contributesToTracking=true`, computar y guardar `stakeAmount` y `rolloverContribution`.
  4. UPDATE `UsageTracking.usageData` (JSON) — solo agregados, sin participatingBets[].
  5. UPDATE `UsageTracking.balance`.
- **Agregados a nivel de Reward:** Combinar datos de QC tracking + usage tracking de esa reward.
  `reward.totalRisk`, `reward.totalProfit`, `reward.balance`, `reward.yield`.
- **Agregados a nivel de Promotion:** Combinar datos de todas las rewards + depósitos.
  `promotion.totalRisk`, `promotion.totalProfit`, `promotion.balance`, `promotion.yield`.
- NO cambiar `status` de QC, Reward ni UsageTracking (esos son manuales con timestamp).
- Referencia de patrón: `DepositService.updateConditionTrackingAndRewardValue()` (L153-200).

### Fase 4 — Frontend

#### 4.1 Formulario de registro batch (creación)
- **Datos del evento** configurados a nivel de batch (compartidos por todas las legs):
  - eventName, marketName, eventOptions (TWO/THREE/MULTIPLE_OPTIONS), eventDate?.
  - En SINGLE/NONE: 1 grupo de campos de evento.
  - En COMBINED_2: 2 grupos. En COMBINED_3: 3 grupos.
- **Config de strategy:** toggle "¿Con cobertura?" (NO=NONE, SÍ=HEDGE).
  Si HEDGE: selector de strategyType (MB/Dutching), lineMode (Simple/Combinada 2/3),
  mode (Standard/Overlay/Underlay), dutchingOptionsCount (2/3 si aplica).
- **UX secuencial obligatoria:** las opciones de cada paso se derivan del catálogo de
  escenarios soportados, no de una matriz hardcodeada en el form.
  - Si el usuario elige una opción que reduce el espacio de escenarios válidos, los
    pasos posteriores se recalculan y resetean si ya no aplican.
  - Ejemplos: `COMBINED_*` oculta OVERLAY/UNDERLAY; `DUTCHING + SINGLE + THREE_OPTIONS`
    no muestra PREPAYMENT si no existe fórmula; cambiar de DUTCHING a MATCHED_BETTING
    limpia `dutchingOptionsCount`.
  - Implementación recomendada: usar helpers de `shared`
    (`getAvailableScenarioOptions`, `isScenarioSupported`) para poblar selects y
    decidir visibilidad/disabled state.
- **Sin `hedgeAdjustmentType`** — solo se ofrece en edición.
- Número de subformularios por leg determinado por la configuración:
  - kind=NONE → 1 leg.
  - MB + SINGLE → 2 legs (MAIN + HEDGE1).
  - MB + COMBINED_2 → 3 legs (MAIN + HEDGE1 + HEDGE2).
  - MB + COMBINED_3 → 4 legs (MAIN + HEDGE1 + HEDGE2 + HEDGE3).
  - DUTCHING + SINGLE + 2 options → 2 legs (MAIN + HEDGE1).
  - DUTCHING + SINGLE + 3 options → 3 legs (MAIN + HEDGE1 + HEDGE2).
  - DUTCHING + COMBINED_2 → 3 legs (MAIN + HEDGE1 + HEDGE2).
  - DUTCHING + COMBINED_3 → 4 legs (MAIN + HEDGE1 + HEDGE2 + HEDGE3).
- Cada leg: bookmaker, selección (via `selections[]`), odds, stake, comisión?, enhancedOdds toggle, placedAt.
  Los campos de evento (eventName, market, etc.) ya vienen del batch, no se repiten por leg.
  MAIN combinada: `selections[]` tiene N elementos, cada uno con cuota individual
  (las odds del campo principal son la cuota combinada = producto de individuales).
- Cada leg: sección de participaciones (0..N) con botón "+ Añadir contexto de promoción"
  que abre selector con `getAvailablePromotionContexts(bookmakerAccountId)`.
- Motor de cálculo reactivo calcula stakes de hedge, profit, risk, yield en tiempo real.
  También calcula agregados del batch (profit total, risk total, yield total).
- **Previsualización de impacto:** Si la apuesta participa en promos, el frontend
  muestra previsualización del impacto en los agregados del tracking (ej: "con esta apuesta,
  el rollover sería 350/500€, yield 97%") leyendo datos actuales de la API y sumando
  los valores del formulario.
- **Puntos de entrada:** El formulario es el MISMO independientemente de cómo se acceda:
  1. **Desde QC/Reward:** Pre-rellena la primera participación de la MAIN leg con contexto.
  2. **Desde botón genérico** (listado de apuestas, dashboard): Formulario vacío.
  El punto de entrada NO es un "tipo de apuesta" — es solo UX.

#### 4.1a UX de selección contextual de participaciones (bloqueante antes de más escenarios)
- **Problema detectado:** El selector actual de participaciones muestra labels demasiado pobres
  (`promotionName · rewardType`, etc.). No da suficiente contexto para decidir qué apuesta
  registrar ni para entender por qué el escenario derivado es `GENERATE_FREEBET` o `USE_FREEBET`.
- **Decisión:** NO seguir implementando nuevos escenarios de cálculo hasta que la selección
  de participaciones sea contextual y autosuficiente.
- `Añadir QT` y `Añadir RU` NO deben abrir un `select` ciego como UX principal.
  Deben abrir un selector contextual (popover, drawer, modal o lista expandida) que renderice
  cada contexto como una card resumida.
- El backend debe alimentar este selector con suficiente contexto de negocio. Opción preferida:
  enriquecer `getAvailablePromotionContexts(bookmakerAccountId)` con un payload de preview
  denormalizado para QT y RU, en lugar de forzar N+1 queries desde el frontend.
- Una vez elegida la participación, la card persistida dentro de la leg debe mostrar un resumen
  visible y legible de:
  - qué promo/reward/QC se está usando,
  - qué condiciones aplica,
  - qué impacto tiene sobre el cálculo,
  - y si esa participación es la `target` del cálculo.

**Contenido mínimo visible en selector de QT**
- promoción,
- tipo de qualify condition,
- descripción,
- stake objetivo,
- restricciones de odds,
- outcome requerido si aplica,
- intentos máximos / retries si aplica,
- rewards que desbloquea.

**Contenido mínimo visible en selector de RU**
- promoción,
- fase / reward,
- tipo de reward,
- valor de la reward,
- saldo restante / progreso de uso,
- `mustUseComplete`,
- `allowMultipleBets`,
- restricciones de odds / stake,
- `stakeNotReturned` y `retentionRate` cuando la reward sea FREEBET.

**Matriz de aplicabilidad en registro de apuestas**
- **QUALIFY_TRACKING que SÍ debe aparecer en bets**
  - `BET`
  - `LOSSES_CASHBACK`
- **QUALIFY_TRACKING que NO debe aparecer en bets**
  - `DEPOSIT`
  - Motivo: una apuesta no puede satisfacer una condición de depósito.
- **REWARD_USAGE que SÍ puede aparecer en bets**
  - `FREEBET`
  - `CASHBACK_FREEBET`
  - `BET_BONUS_ROLLOVER`
  - `BET_BONUS_NO_ROLLOVER`
  - `ENHANCED_ODDS`
- **REWARD_USAGE que NO debe aparecer en bets**
  - `CASINO_SPINS`
  - Motivo: no se pueden usar spins de casino dentro de una apuesta.

**Campos extra por tipo de QT**
- `BET`
  - stake objetivo o rango de stake,
  - restricciones de odds,
  - resultado requerido,
  - retries / maxAttempts,
  - `allowMultipleBets`,
  - `onlyFirstBetCounts`,
  - rewards que desbloquea.
- `LOSSES_CASHBACK`
  - cashback %,
  - cashback máximo,
  - método de cálculo,
  - restricciones de odds / stake,
  - resultado requerido si aplica,
  - `allowMultipleBets`,
  - reglas de settled / returned / cashout si aplican,
  - rewards que desbloquea.
- `DEPOSIT`
  - no aplica a selector de bets.

**Campos extra por tipo de RU**
- `FREEBET`
  - valor de la reward,
  - `remainingBalance`,
  - `mustUseComplete`,
  - `allowMultipleBets`,
  - restricciones de odds / stake,
  - `stakeNotReturned`,
  - `retentionRate`.
- `CASHBACK_FREEBET`
  - valor de referencia,
  - saldo o progreso si aplica,
  - restricciones de odds / stake,
  - resultado requerido si aplica,
  - `allowMultipleBets`.
- `BET_BONUS_ROLLOVER`
  - valor del bonus,
  - `rolloverProgress`,
  - `remainingRollover`,
  - multiplicador,
  - restricciones de odds / stake,
  - resultado requerido si aplica,
  - `allowMultipleBets`.
- `BET_BONUS_NO_ROLLOVER`
  - valor del bonus,
  - `totalUsed`,
  - restricciones de odds / stake,
  - resultado requerido si aplica,
  - `allowMultipleBets`,
  - reglas de settled / returned / cashout si aplican.
- `ENHANCED_ODDS`
  - cuota normal,
  - cuota mejorada o % de mejora,
  - stakeRestriction si aplica,
  - `allowMultipleBets`.
- `CASINO_SPINS`
  - no aplica a selector RU de bets.

**Regla UX importante**
- `ENHANCED_ODDS` no debería sentirse como una participación manual genérica.
  En bets, la UX preferida sigue siendo un toggle/flujo específico de cuota mejorada
  a nivel de leg, que internamente genera la participación `REWARD_USAGE`.

**Contenido mínimo visible en la card ya añadida a la leg**
- badge `QT` o `RU`,
- promoción y fase,
- resumen corto de condiciones,
- resumen corto de reward / uso,
- badge `Participación objetivo` si gobierna el cálculo,
- ids técnicos solo como dato secundario, no como información principal.

**Checklist de implementación antes de pasar al siguiente cálculo**
- [ ] `Añadir QT` abre selector contextual y no obliga al usuario a decidir con un label mínimo.
- [ ] `Añadir RU` abre selector contextual y muestra saldo/progreso/condiciones de uso relevantes.
- [ ] El usuario puede entender qué stake, odds o tipo de apuesta necesita sin salir del formulario.
- [ ] La card persistida de participación mantiene contexto visible después de seleccionar el item.
- [ ] La participación objetivo del cálculo se distingue visualmente del resto.
- [ ] `getAvailablePromotionContexts` devuelve o permite resolver todo el contexto necesario sin UX opaca.
- [ ] Contextos agotados o no usables (por ejemplo freebet con `remainingBalance=0`) no se ofrecen como seleccionables.
- [ ] Verificado en navegador real con al menos:
  - 1 `QUALIFY_TRACKING` de tipo `BET`
  - 1 `REWARD_USAGE` de tipo `FREEBET`
  - derivación correcta de `scenarioId` al seleccionar cada contexto
  - submit correcto con `200`
  - red/console sin errores bloqueantes
- [ ] Solo cuando esta checklist esté cerrada se continúa con el siguiente escenario de cálculo.

**Orden de implementación acordado para esta mejora**
1. [ ] Añadir lanzadores contextuales desde detalle de `Qualify Condition` y detalle de `Reward` hacia `bets/new`.
   - CTA esperados:
     - `Registrar apuesta para esta condición`
     - `Usar esta reward`
   - El formulario canónico sigue siendo `bets/new`; no se incrusta el batch form completo dentro del form de promotion/reward/QC.
2. [ ] Hacer que `bets/new` acepte contexto de entrada por query params y muestre un banner persistente de origen.
   - Debe pre-rellenar al menos:
     - `bookmakerAccountId` de la primera leg,
     - la primera participación contextual en la leg inicial,
     - y el contexto visible de `QC` o `Reward` desde el que se abrió el flujo.
   - El punto de entrada contextual NO fuerza por sí solo un tipo de apuesta; solo reduce fricción.
3. [ ] Mejorar después el selector interno de participaciones (`Añadir QT` / `Añadir RU`) con previews ricos y cards contextualizadas.
   - Este paso sustituye al selector ciego actual como UX principal dentro del formulario.
4. [ ] Añadir más adelante tablas read-only de apuestas relacionadas dentro de `QC` / `Reward` / `UsageTracking`.
   - Sirven para seguimiento y auditoría.
   - No bloquean esta primera iteración de punto de entrada contextual.

**Checklist específica de esta iteración**
- [ ] Desde un `QC` aplicable se puede abrir `bets/new` con contexto precargado.
- [ ] Desde una `Reward` usable en apuestas se puede abrir `bets/new` con contexto precargado.
- [ ] `UsageTrackingForm` sigue siendo read-only; registrar bets ocurre en `bets/new`, no inline dentro del tracking.
- [ ] `bets/new` muestra claramente el contexto de origen y permite continuar el registro sin perderlo.
- [ ] La participación contextual inicial se crea automáticamente solo cuando el contexto es válido para la cuenta seleccionada.
- [ ] La UX contextual queda validada en navegador real antes de seguir con el siguiente bloque de cálculo.

#### 4.1b Formulario de edición batch
- Carga datos existentes del batch (incluidos `betId` de cada leg).
- Permite cambiar datos de legs existentes (odds, stake, status, participaciones).
- Permite añadir nuevas legs (sin betId) o eliminar existentes (no incluirlas en el input).
- **`hedgeAdjustmentType` disponible SOLO aquí:**
  - Selector UNMATCHED / PREPAYMENT aparece en modo edición.
  - Al seleccionar uno → aparece nueva leg (HEDGE2) con campos específicos
    (cuota nueva, monto igualado en UNMATCHED; cuota actual en PREPAYMENT).
  - Motor de cálculo reactivo recalcula con la nueva leg.
- Al guardar, el frontend envía el batch COMPLETO con una sola llamada a `updateBatch`.
  El backend hace diff automático (CREATE/UPDATE/DELETE legs y participaciones).
  No hay orquestación de orden de operaciones — una transacción atómica lo resuelve todo.

#### 4.2 Motor de cálculo reactivo
- Refactor de `docs/legacy/calculate.ts`: funciones puras `(legs, strategy, targetContext) → outputs`.
- Selector determinista: `(strategyConfig + targetParticipation) → scenarioId → función`.
- Triggers de recálculo por cambio en odds/stake/commission de cualquier leg.
- En modo edición, al seleccionar `hedgeAdjustmentType` UNMATCHED/PREPAYMENT → aparece
  leg extra y se recalcula con el escenario de adjustment correspondiente.
- Reset de campos no aplicables al cambiar escenario.

#### 4.3 Standalone (punto de entrada genérico)
- NO es un tipo de apuesta — es un **punto de entrada** al formulario sin contexto previo.
- Mismo formulario exacto. El usuario puede:
  - Registrar 1 apuesta sin hedge ni promos (kind=NONE, participations=[]).
  - Registrar 1 apuesta sin hedge pero con promos (kind=NONE, + participaciones).
  - Registrar apuesta con hedge y con/sin promos (kind=HEDGE, configuración normal).
  - Registrar "relleno" (apuestas para que el bookmaker no sospeche de apuestas solo en promos).

#### 4.4 Vistas + acciones
- **Lista de apuestas (flat):** Tabla con todas las bets del usuario. Al expandir una fila,
  muestra las legs relacionadas del mismo batch (si MAIN, muestra sus hedges; si HEDGE,
  muestra MAIN y otros hedges). Columnas: evento, selección, bookmaker, odds, stake,
  profit, risk, yield, estado, fecha.
- **Lista de batches:** Tabla con batches del usuario (resumen: nº legs, profit total,
  risk total, yield). Al expandir, muestra todas las legs del batch con detalle.
  Filtrable por strategyKind, status, bookmaker.
- **Lista por promoción:** Tabla de promociones con sus batches anidados. Cada batch
  indica si participa en contexto de QT o RU. Al expandir, muestra legs.
- **Lista por QC:** QualifyConditions con batches que contribuyen, filtrable por estado.
  Muestra progreso de calificación, agregados.
- **Lista por UsageTracking:** Rewards en uso con batches que contribuyen, filtrable.
  Muestra progreso de uso (rollover, remainingBalance, etc.), agregados.
- **Dashboard:** Totales globales — profit, risk, yield, nº batches, nº bets,
  distribución por bookmaker, distribución por estado.
- **Acciones:** Editar batch (abre formulario en modo edición), eliminar batch (confirma
  y ejecuta `deleteBatch`).

### Fase 5 — Testing

#### 5.1 Tests de schema (Fase 1)
- Sin hedge válido (participations=[]).
- Multi-participación por leg válido.
- Mezcla QC + REWARD_USAGE entre legs válido.
- target.participationKey que no resuelve a ninguna participación del input → inválido.
- participationKey duplicado en input → inválido.
- calculationRewardId ∉ rewardIds → inválido.
- Más de 1 contributesToTracking=true por mismo objetivo → inválido.
- Objetivo sin ningún contributesToTracking=true → inválido.
- DUTCHING + SINGLE + MULTIPLE_OPTIONS → inválido (solo TWO/THREE soportados).
- hedgeAdjustmentType presente en creación → inválido (solo en edición).
- kind=NONE con legRole no null → inválido.
- kind=HEDGE con mode faltante → inválido.
- events.length no coincide con lineMode → inválido.
- eventIndex fuera de rango de events → inválido.
- MAIN combinada sin selections → inválido.
- strategy.kind=NONE con target presente → inválido (NONE no usa cálculo de hedge).
- strategy.kind=HEDGE con participaciones y target ausente → inválido (target obligatorio si hay participaciones).
- REWARD_USAGE con rewardType=CASINO_SPINS → inválido (spins no se usan en apuestas).
- target con ambos participationId + participationKey presentes → inválido (solo update).
- target existe pero sin participationId ni participationKey → inválido (solo update).

#### 5.2 Tests de integración (Fase 3)
- Registro batch sin hedge + listado.
- Registro batch con hedge + verificación de roles.
- Registro batch con multi-promo por leg + tracking recalculado.
- Integridad referencial (promo/reward/QC inexistente = error).
- rewardType en participación no coincide con reward real → inválido (snapshot inconsistente).
- target.participationId inexistente o no perteneciente al batch → inválido (solo update).
- **updateBatch (añadir leg):** enviar batch con leg nueva (sin betId) de ajuste
  (UNMATCHED/PREPAYMENT), verificar que legs existentes conservan sus IDs, tracking recalculado.
- **updateBatch (adjustmentType con combinada):** adjustmentType en StrategyContext con
  combinada → error (solo SINGLE admite adjustment).
- **updateBatch (cambiar datos leg):** cambiar odds/stake de leg existente (con betId),
  tracking recalculado para participaciones afectadas.
- **updateBatch (eliminar participación target):** enviar batch sin la participación a la
  que apunta target → error (target colgante). Frontend debe reasignar target en el mismo input.
- **updateBatch (eliminar leg):** enviar batch sin una leg que tenía participación target
  → error. Sin target → tracking recalculado correctamente.
- **deleteBatch:** tracking recalculado para todos los objetivos afectados.

#### 5.3 Tests de cálculo (Fase 4)
- Cada escenarioId → función correcta.
- Recálculo reactivo por trigger.
- Reset de campos al cambiar escenario.

#### 5.4 Checklist manual por escenario
- Objetivo: usar esta lista como criterio de aceptación funcional del motor de cálculo
  reactivo en frontend, escenario por escenario.
- Estado real detectado en la implementación actual:
  - `BetBatchForm` deriva `scenarioId` y sincroniza la topología de legs.
  - `BetBatchForm` agrega `profit`, `risk`, `yield` del batch a partir de los valores YA
    presentes en las legs.
  - No existe todavía una conexión explícita entre el formulario y las funciones legacy de
    `docs/legacy/calculate.ts`; por tanto, el cálculo secuencial automático de
    stakes/beneficios/riesgos dependientes por escenario debe considerarse **pendiente**.
  - También hay que validar la fórmula de `yield`: el plan define
    `yield = profit / |risk| * 100`, y el frontend actual debe alinearse a esa definición.

##### Criterio de Done por escenario
- [ ] El formulario deriva el `scenarioId` correcto según la configuración.
- [ ] La topología de legs coincide con `expectedLegRoles`.
- [ ] Los campos calculados empiezan en estado neutro y no muestran basura residual al cambiar
  de escenario.
- [ ] Los triggers correctos disparan recálculo reactivo.
- [ ] El orden secuencial de cálculo respeta la fórmula documentada del escenario.
- [ ] Los campos derivados se recalculan automáticamente sin intervención manual del usuario.
- [ ] El resumen del batch recalcula `profit`, `risk`, `yield` con la misma semántica que el plan.
- [ ] Crear/editar respeta las restricciones del escenario
  (`hedgeAdjustmentType`, target promocional, cardinalidad, etc.).
- [ ] El submit persiste exactamente los valores calculados y el backend no los altera.

##### Escenario piloto 01 — `SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO`
- Referencias funcionales:
  - Descriptor: `strategyType=MATCHED_BETTING`, `lineMode=SINGLE`, `mode=STANDARD`,
    `promoAction=NO_PROMO`, `expectedLegRoles=['MAIN', 'HEDGE1']`.
  - Función legacy de referencia:
    `calculate_simple_matched_betting_standard_no_promotion()`.
  - Mapa de dependencias legacy:
    `mainLeg.stake`, `mainLeg.odds`, `hedgeLeg1.odds`, `hedgeLeg1.commission`.
- Orden secuencial esperado para este escenario:
  1. `main.risk = -main.stake`
  2. `main.profit = (main.odds - 1) * main.stake`
  3. `hedge1.stake = (main.odds * main.stake) / (hedge1.odds - hedge1.commission / 100)`
  4. `hedge1.risk = -((hedge1.odds - 1) * hedge1.stake)`
  5. `hedge1.profit = hedge1.stake * (1 - hedge1.commission / 100)`
  6. `yield` por leg y batch según la definición del plan:
     `profit / |risk| * 100`
- Checklist funcional:
  - [x] En creación, la configuración `Con cobertura + Matched Betting + Simple + Estándar`
    deriva `scenarioId = SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO`.
  - [x] En creación no se muestra `hedgeAdjustmentType`.
  - [x] El formulario genera exactamente 2 legs: `MAIN` y `HEDGE1`.
  - [x] Estado inicial neutro: `profit/risk/yield` arrancan en `0` y la comisión de
    `HEDGE1` se pre-rellena con `2%`.
  - [x] Al informar `MAIN.stake` y `MAIN.odds`, se recalculan automáticamente
    `MAIN.profit`, `MAIN.risk` y `MAIN.yield`.
  - [x] Al informar `HEDGE1.odds` con comisión por defecto, se recalculan automáticamente
    `HEDGE1.stake`, `HEDGE1.profit`, `HEDGE1.risk` y `HEDGE1.yield`.
  - [x] Al cambiar `HEDGE1.commission`, se recalculan de nuevo `HEDGE1.stake`,
    `HEDGE1.profit`, `HEDGE1.risk`, `HEDGE1.yield` y el resumen del batch.
  - [x] El resumen del batch recalcula `profit`, `risk` y `yield` sin edición manual.
  - [x] El submit persiste el batch y, al reabrirlo, los valores calculados coinciden con
    los mostrados antes de guardar.
  - [x] Estado actual: completado y validado en navegador real.
- Decisiones UX cerradas para este escenario:
  - El evento base se edita dentro de la leg `MAIN`; `HEDGE1` hereda `Evento`,
    `Fecha`, `Mercado` y deriva la selección como `En contra de {selección main}`.
  - En `HEDGE1`, `Stake propuesto` es editable manualmente; si cambian los drivers
    originales (`MAIN.stake`, `MAIN.odds`, `HEDGE1.odds`, `HEDGE1.commission`),
    el sistema vuelve a proponer el stake calculado por la fórmula original.
  - Los campos `profit`, `risk` y `yield` salen de la configuración de las legs y se
    presentan en la zona `Resumen y cálculo`.
  - El resumen se divide en:
    - una tabla por leg con `Back` y `Lay` (`Stake`, `Cuota`, `Retorno`, `Riesgo`,
      `Beneficio si gana`);
    - una tabla global con fila `Global` (`Turnover`, `Beneficio si gana Backbet`,
      `Beneficio si gana Laybet`, `Yield si gana Backbet`, `Yield si gana Laybet`).
  - En edición, `hedgeAdjustmentType` se proyecta dentro de la leg compatible:
    `PREPAYMENT` en cuentas no `EXCHANGE`, `UNMATCHED` en cuentas `EXCHANGE`.

##### Backlog de validación por escenarios

**Single matched betting**
- [x] `SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO`
- [x] `SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET`
- [x] `SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET`
- [ ] `SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO_UNMATCHED`
- [ ] `SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET_UNMATCHED`
- [ ] `SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET_UNMATCHED`
- [ ] `SINGLE_MATCHED_BETTING_STANDARD_PREPAYMENT`
- [x] `SINGLE_MATCHED_BETTING_UNDERLAY_NO_PROMO`
- [ ] `SINGLE_MATCHED_BETTING_UNDERLAY_USE_FREEBET`
- [ ] `SINGLE_MATCHED_BETTING_UNDERLAY_GENERATE_FREEBET`
- [ ] `SINGLE_MATCHED_BETTING_UNDERLAY_PREPAYMENT`
- [x] `SINGLE_MATCHED_BETTING_OVERLAY_NO_PROMO`
- [ ] `SINGLE_MATCHED_BETTING_OVERLAY_USE_FREEBET`
- [ ] `SINGLE_MATCHED_BETTING_OVERLAY_GENERATE_FREEBET`
- [ ] `SINGLE_MATCHED_BETTING_OVERLAY_PREPAYMENT`

**Single dutching 2 options**
- [ ] `SINGLE_DUTCHING_2_OPTIONS_STANDARD_NO_PROMO`
- [ ] `SINGLE_DUTCHING_2_OPTIONS_STANDARD_USE_FREEBET`
- [ ] `SINGLE_DUTCHING_2_OPTIONS_STANDARD_GENERATE_FREEBET`
- [ ] `SINGLE_DUTCHING_2_OPTIONS_STANDARD_PREPAYMENT`
- [ ] `SINGLE_DUTCHING_2_OPTIONS_UNDERLAY_NO_PROMO`
- [ ] `SINGLE_DUTCHING_2_OPTIONS_UNDERLAY_USE_FREEBET`
- [ ] `SINGLE_DUTCHING_2_OPTIONS_UNDERLAY_PREPAYMENT`
- [ ] `SINGLE_DUTCHING_2_OPTIONS_OVERLAY_NO_PROMO`
- [ ] `SINGLE_DUTCHING_2_OPTIONS_OVERLAY_USE_FREEBET`
- [ ] `SINGLE_DUTCHING_2_OPTIONS_OVERLAY_PREPAYMENT`

**Single dutching 3 options**
- [ ] `SINGLE_DUTCHING_3_OPTIONS_STANDARD_NO_PROMO`
- [ ] `SINGLE_DUTCHING_3_OPTIONS_STANDARD_USE_FREEBET`
- [ ] `SINGLE_DUTCHING_3_OPTIONS_STANDARD_GENERATE_FREEBET`
- [ ] `SINGLE_DUTCHING_3_OPTIONS_UNDERLAY_NO_PROMO`

**Combined 2**
- [ ] `COMBINED_2_DUTCHING_STANDARD_NO_PROMO`
- [ ] `COMBINED_2_DUTCHING_STANDARD_USE_FREEBET`
- [ ] `COMBINED_2_DUTCHING_STANDARD_GENERATE_FREEBET`
- [ ] `COMBINED_2_MATCHED_BETTING_STANDARD_NO_PROMO`
- [ ] `COMBINED_2_MATCHED_BETTING_STANDARD_USE_FREEBET`
- [ ] `COMBINED_2_MATCHED_BETTING_STANDARD_GENERATE_FREEBET`

**Combined 3**
- [ ] `COMBINED_3_MATCHED_BETTING_STANDARD_NO_PROMO`
- [ ] `COMBINED_3_MATCHED_BETTING_STANDARD_USE_FREEBET`
- [ ] `COMBINED_3_MATCHED_BETTING_STANDARD_GENERATE_FREEBET`
- [ ] `COMBINED_3_DUTCHING_STANDARD_NO_PROMO`
- [ ] `COMBINED_3_DUTCHING_STANDARD_USE_FREEBET`
- [ ] `COMBINED_3_DUTCHING_STANDARD_GENERATE_FREEBET`

## 4. Orden de ejecución recomendado

1. **Fase 0** (prerrequisitos): ScenarioId enum + decisiones → **bloquea Fase 1** (sin el enum no se pueden definir los schemas).
2. **Fase 1** (shared): schemas → sin dependencias.
3. **Fase 2** (Prisma): migración → depende de Fase 1 para alinear tipos.
4. **Fase 3** (backend): API + service → depende de Fase 1 + 2.
5. **Fase 4** (frontend): forms + cálculo → depende de Fase 1 + 3.
6. **Fase 5** (testing): se ejecuta en paralelo con cada fase (TDD idealmente).

## 5. Auditoría final — Gaps identificados

### N1 — `enhancedOdds` falta en Prisma `Bet` — ✅ CERRADO (Fase 2.2)
- Schema simplificado: `{ originalOdds: number }` (1 campo).
  `odds` de la leg es la cuota efectiva (mejorada si enhanced). `originalOdds` es sin mejora.
  `refundValue`, `retentionRate`, `isSnr` viven en la reward, NO en la bet.
- Ya cubierto en §2.2: `enhancedOdds Json?` listado como campo a añadir.

### N2 — `bet.transformer.ts` — ✅ CERRADO (Fase 3)
- Detallado en §3 Fase 3: crear `bet.transformer.ts` con funciones de conversión
  Prisma↔Zod siguiendo el patrón existente de transformers.

### N3 — `IBetService` en context.ts — ✅ CERRADO (Fase 3.3)
- Detallado en §3 Fase 3.1/3.3: crear `IBetService` con 3 mutaciones + 8 queries,
  registrar en `context.ts` y añadir al tRPC router.

### N4 — Cascada de tracking — ✅ CERRADO (Fase 3.4)
- Detallado en §3 Fase 3.4: `recalculateTracking()` sigue el patrón de DepositService.
  Cascada: QC.trackingData → Reward.balance → Phase.totalBalance → Promotion.totalBalance.
  Mismo patrón para UsageTracking.usageData → UsageTracking.balance.

### N5— Relación `eventOptions` ↔ `dutchingOptionsCount` — ✅ CERRADO
- `OptionsSchema` = `TWO_OPTIONS | THREE_OPTIONS | MULTIPLE_OPTIONS` (ya definido en enums).
- `dutchingOptionsCount` (2|3) SOLO aplica a `DUTCHING + SINGLE`.
  En combinadas, el número de legs se determina por `lineMode` (COMBINED_2/3), no por options.
- **Relación:** `dutchingOptionsCount` se puede derivar del `events[0].eventOptions` del batch:
  TWO_OPTIONS→2, THREE_OPTIONS→3.
- **MULTIPLE_OPTIONS + DUTCHING + SINGLE:** RECHAZADO en validación. Las funciones de cálculo
  solo existen para 2 y 3 options. Si el mercado tiene más de 3 selecciones, no es un escenario
  de dutching simple soportado. SuperRefine rechaza esta combinación con error descriptivo.
  Si en el futuro se necesita soporte para 4+ options, habrá que crear nuevas funciones de cálculo.
- Para DUTCHING + COMBINED_*, `dutchingOptionsCount` es NULL. Los legs se derivan
  directamente de `lineMode`: COMBINED_2→3 legs, COMBINED_3→4 legs.

### N6 — Constraints SQL manuales: inventario completo (MEDIUM, Fase 2.4)
El plan dice "añadir SQL manual" sin listar. Inventario completo:

**CHECKs (integridad básica):**
1. `bet_participations`: kind IN ('QUALIFY_TRACKING', 'REWARD_USAGE')
2. `bet_participations`: IF kind='QUALIFY_TRACKING' THEN qualifyConditionId NOT NULL
3. `bet_participations`: IF kind='REWARD_USAGE' THEN usageTrackingId NOT NULL
4. `bet_participations`: IF kind='REWARD_USAGE' THEN rewardId NOT NULL
5. `bet_registration_batches`: strategyKind IN ('NONE', 'HEDGE')
6. `bet_registration_batches`: IF strategyKind='NONE' THEN strategyType IS NULL AND lineMode IS NULL AND mode IS NULL AND dutchingOptionsCount IS NULL AND hedgeAdjustmentType IS NULL AND scenarioId IS NULL AND calculationParticipationId IS NULL
7. `bets`: legOrder >= 0

**CHECKs (nullabilidad cruzada por kind):**
8. `bet_participations`: IF kind='QUALIFY_TRACKING' THEN usageTrackingId IS NULL AND rewardId IS NULL
   — QT usa qualifyConditionId + rewardIds[], no rewardId singular ni usageTrackingId.
9. `bet_participations`: IF kind='REWARD_USAGE' THEN qualifyConditionId IS NULL AND calculationRewardId IS NULL AND (rewardIds IS NULL OR rewardIds = '{}')
   — RU usa usageTrackingId + rewardId. No tiene qualifyConditionId, calculationRewardId, ni rewardIds.
10. `bet_participations`: IF kind='QUALIFY_TRACKING' THEN rewardType IS NOT NULL
    — rewardType indica qué tipo de reward se trackea/genera (FREEBET, BET_BONUS_ROLLOVER, etc.).
11. `bet_participations`: IF kind='REWARD_USAGE' THEN rewardType IS NOT NULL
    — rewardType indica qué tipo de reward se está usando (FREEBET, ENHANCED_ODDS, etc.).
12. `bet_participations`: IF kind='QUALIFY_TRACKING' THEN rewardIds IS NOT NULL AND array_length(rewardIds, 1) > 0
    — QT siempre referencia al menos 1 reward que la QC puede generar.
13. `bet_participations`: IF kind='QUALIFY_TRACKING' THEN calculationRewardId IS NOT NULL AND calculationRewardId = ANY(rewardIds)
    — calculationRewardId es OBLIGATORIO para QT: identifica la reward en cuyo contexto se
    creó la participación. Debe ser miembro de rewardIds.
14. `bet_participations`: contributesToTracking IS NOT NULL
    — Siempre explícito (true/false), nunca NULL.
15. `bet_participations`: IF kind='QUALIFY_TRACKING' THEN stakeAmount IS NULL AND rolloverContribution IS NULL
    — Snapshots de contribución solo aplican a REWARD_USAGE.

**CHECKs (matriz de estrategia):**
16. `bet_registration_batches`: IF strategyKind='HEDGE' THEN strategyType IS NOT NULL
17. `bet_registration_batches`: IF strategyKind='HEDGE' THEN lineMode IS NOT NULL
18. `bet_registration_batches`: IF strategyKind='HEDGE' THEN scenarioId IS NOT NULL
19. `bet_registration_batches`: IF strategyType='DUTCHING' AND lineMode='SINGLE' THEN dutchingOptionsCount IS NOT NULL AND dutchingOptionsCount IN (2,3)
20. `bet_registration_batches`: IF strategyType='MATCHED_BETTING' THEN dutchingOptionsCount IS NULL
21. `bet_registration_batches`: IF strategyType='DUTCHING' AND lineMode IN ('COMBINED_2','COMBINED_3') THEN dutchingOptionsCount IS NULL
22. `bet_registration_batches`: IF lineMode IN ('COMBINED_2','COMBINED_3') THEN mode = 'STANDARD'
    — Combinadas siempre son STANDARD. OVERLAY/UNDERLAY solo aplica a SINGLE.
23. `bet_registration_batches`: IF strategyKind='HEDGE' THEN mode IS NOT NULL
    — mode (STANDARD/OVERLAY/UNDERLAY) es obligatorio cuando hay hedge.
24. `bet_registration_batches`: IF hedgeAdjustmentType IS NOT NULL THEN lineMode = 'SINGLE'
    — Ajustes UNMATCHED/PREPAYMENT solo aplican a apuestas simples, no combinadas.
25. `bet_registration_batches`: IF hedgeAdjustmentType = 'UNMATCHED' THEN strategyType = 'MATCHED_BETTING'
    — UNMATCHED solo aplica a matched betting (concepto de exchange). PREPAYMENT aplica a MB y DUTCHING.
26. `bets`: legRole IS NULL OR legRole IN ('MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3')
    — Defense in depth: los valores válidos de legRole se validan también en schema (LegRoleSchema),
      pero el CHECK SQL previene datos inválidos por bypass o error de servicio.
27. `bet_registration_batches`: strategyType IS NULL OR strategyType IN ('MATCHED_BETTING', 'DUTCHING')
    — Defense in depth para valores de strategyType.
28. `bet_registration_batches`: lineMode IS NULL OR lineMode IN ('SINGLE', 'COMBINED_2', 'COMBINED_3')
    — Defense in depth para valores de lineMode.
29. `bet_registration_batches`: mode IS NULL OR mode IN ('STANDARD', 'OVERLAY', 'UNDERLAY')
    — Defense in depth para valores de mode.
30. `bet_registration_batches`: hedgeAdjustmentType IS NULL OR hedgeAdjustmentType IN ('UNMATCHED', 'PREPAYMENT')
    — Defense in depth para valores de hedgeAdjustmentType.
31. `bet_participations`: rewardType IS NULL OR rewardType IN ('FREEBET', 'CASHBACK_FREEBET', 'BET_BONUS_ROLLOVER', 'BET_BONUS_NO_ROLLOVER', 'ENHANCED_ODDS', 'CASINO_SPINS')
    — Defense in depth para valores de rewardType. Alineado con RewardTypeSchema existente en shared.
32. `bet_participations`: IF kind='REWARD_USAGE' THEN rewardType != 'CASINO_SPINS'
    — No se pueden "usar" giros de casino en una apuesta. CASINO_SPINS solo es válido en QT
      (calificar para spins apostando). El tracking de uso de spins es manual, no via bet.

**Nota:** La validación de cardinalidad de legs por lineMode/strategyType (ej: DUTCHING+COMBINED_3
requiere exactamente 4 legs, MB+COMBINED_2 requiere 3) se hace en el servicio (application layer),
no en SQL. La razón es que `updateBatch` puede transicionar cardinalidad (ej: añadir leg de
adjustment), y un CHECK cross-table no es viable.

**Partial Unique Indexes:**
33. `UNIQUE(batchId, legRole) WHERE legRole IS NOT NULL` — en `bets`
34. `UNIQUE(batchId, legOrder)` — en `bets`
35. `UNIQUE(batchId) WHERE legRole IS NULL` — en `bets`
    — Un batch con strategyKind=NONE solo puede tener 1 leg (sin rol).
      Previene errores de servicio que creen múltiples legs sin rol en un batch.
36. `UNIQUE(betId, kind, qualifyConditionId) WHERE kind='QUALIFY_TRACKING'`
37. `UNIQUE(betId, kind, usageTrackingId) WHERE kind='REWARD_USAGE'`
38. `UNIQUE(batchId, qualifyConditionId) WHERE kind='QUALIFY_TRACKING' AND contributesToTracking=true`
    — Dentro de un batch, máximo 1 participación contribuye al tracking por QC.
      Distintos batches pueden contribuir al mismo objetivo (la agregación sum en tracking).
39. `UNIQUE(batchId, usageTrackingId) WHERE kind='REWARD_USAGE' AND contributesToTracking=true`
    — Mismo principio: 1 participación activa por usage tracking dentro de un batch.

**GIN Indexes:**
40. `GIN(rewardIds)` — en `bet_participations` (para queries de rewards participantes)

**Regular Indexes:**
41. `INDEX(batchId)` en `bets`
42. `INDEX(batchId)` en `bet_participations`
43. `INDEX(qualifyConditionId)` en `bet_participations`
44. `INDEX(usageTrackingId)` en `bet_participations`
45. `INDEX(bookmakerAccountId)` en `bets` (FK a bookmaker_accounts)
46. `INDEX(promotionId)` en `bet_participations` (desnormalización, queries por promo)

### N7 — `usageTrackingId` obligatorio para REWARD_USAGE — ✅ CERRADO
- **Decisión:** SÍ, es mandatory. Cada REWARD_USAGE participation debe apuntar
  a un `RewardUsageTracking` existente para poder actualizar `usageData`.
- Ya garantizado por CHECK constraint #3: `IF kind='REWARD_USAGE' THEN usageTrackingId NOT NULL`.

### N8 — `recalculateTracking()` requiere extracción (MEDIUM, Fase 3.4)
- Actualmente la lógica de tracking está **inline** en `DepositService` (líneas 153-200).
- No existe como función independiente.
- **Acción:** Crear `TrackingService` o función utilitaria que encapsule:
  - Input: `affectedObjectiveIds[]` (QC IDs + UsageTracking IDs)
  - Para cada ID: query bets participantes → agregar métricas → update JSON → cascada balances.
  - Reutilizable por BetService, DepositService (refactor futuro), y cualquier servicio
    que modifique entidades con participaciones.

## 6. Riesgos residuales

1. `rewardIds[]` array sin FK por elemento a nivel SQL → mitigado en servicio transaccional.
2. 46 constraints manuales SQL fuera de control de Prisma → documentar y auditar periódicamente.
3. 41 funciones de cálculo con posible código duplicado → refactor futuro, no bloquea v1.
4. `enhancedOdds` modelado como REWARD_USAGE de rewardType=ENHANCED_ODDS. Extensible a
   otros reward types con patrones similares (cuota mejorada con condiciones).
5. Cascada tracking (QC→Reward→Phase→Promo) es compleja → extraer como servicio compartido.
6. Cardinalidad de legs por lineMode/strategyType validada solo en app layer, no SQL
   (cross-table CHECKs no viables, y `updateBatch` puede transicionar cardinalidad).
7. Rendimiento de tracking cascade en transacciones pesadas: un batch con 4 legs y 12
   participaciones puede tocar ~12 queries de agregación + cascada superior. Mitigar con
   `Promise.all()` para queries paralelas dentro de la transacción y batch updates.
8. `events` como JSON array en batch: no normalizado, pero máximo 3 elementos y no se
   consultan individualmente. Aceptable para v1.
9. `participatingBets[]` eliminado de tracking JSON: la fuente de verdad es `bet_participations`.
   Impacto: si se accede al tracking JSON esperando participatingBets, habrá que refactorizar
   los consumidores (DepositService, frontend).
10. Frontend calcula profit/risk/yield y envía al backend: confianza en el frontend.
    Mitigación: el backend puede validar los cálculos si es necesario en el futuro.
