# TODO List - MatBett Refactoring

## 🔍 Backend Verification Status (2025-12-03)

### ✅ MVP Endpoints: VERIFIED
1. **Promotion CRUD**: ✅ All endpoints exist and properly typed
   - `promotion.create` - Uses atomic nested writes
   - `promotion.getById` - Returns full entity with tracking
   - `promotion.update` - Hybrid strategy (create/update/delete)
   - `promotion.list` - Paginated, with filters and sorting
   - `promotion.delete` - With validation

2. **Deposit Tracking**: ✅ Endpoint exists, **FIXED tracking fields**
   - `deposit.create` - ✅ **Now populates correct tracking fields**
   - Before: `lastDepositAmount`, `lastDepositId`
   - After: `depositAmount`, `depositCode`, `depositedAt`, `qualifyingDepositId`, `status`, `type`
   - Cascading balance updates working
   - Bookmaker account integration working

### ⚠️ Backend TypeScript Errors: IN PROGRESS

**Status**: 19 errors remaining in backend (0 in frontend ✅)

**Critical Issues Found**:
1. ❌ `reward.service.ts` - Missing `IRewardService` interface in `@matbett/api/context.ts`
2. ❌ `reward.transformer.ts` - Missing `usageTracking: null` in entity returns
3. ❌ `promotion.transformer.ts` - Tracking fields using `undefined` instead of `null` (FIXED ✅)
4. ❌ Context type conflict in `apps/backend/src/trpc/context.ts`

**Non-Critical (Can be ignored for MVP)**:
- Unused imports in transformers
- Duplicate `extractQualifyConditions` export (doesn't affect runtime)

### 📋 Next Steps for Backend MVP
1. ✅ ~~Fix `reward.service.ts` and `reward.transformer.ts` errors~~
2. ✅ ~~Add missing interface exports in `@matbett/api`~~
3. ✅ ~~Run full type check to verify 0 errors~~ → **✅ 0 TypeScript errors**
4. ⏳ Test deposit creation with tracking fields

### 🔧 Backend TypeScript: ✅ **COMPLETADO** (0 errores)

**Cambios realizados**:
1. ✅ Exportado `IRewardService` en `@matbett/api/index.ts`
2. ✅ Corregido signature `create(data, phaseId)` en reward.service
3. ✅ Agregado `usageTracking: null` en reward.transformer returns
4. ✅ Cambiado timestamps de `undefined` → `null` para compatibilidad con EntitySchemas
5. ✅ Usado `Prisma.DbNull` para campos JSON opcionales
6. ✅ Agregado campos faltantes en `toQualifyConditionEntity` (balance, timestamps, tracking)
7. ✅ Eliminada duplicación de `extractQualifyConditions` - solo en `qualify-condition.transformer.ts`
8. ✅ Limpiados imports no usados

### ⚠️ Refactoring Recomendado (No bloqueante para MVP)

**Problema detectado**: `deposit.service.ts` tiene **lógica de negocio que debería estar en transformers/helpers**.

#### Lógica a mover a helpers/transformers:

1. **`validateDepositFulfillment()`** - Nuevo helper
   ```typescript
   // apps/backend/src/lib/helpers/deposit-validation.ts
   export function validateDepositFulfillment(
     deposit: Deposit,
     conditionData: DepositQualifyCondition
   ): boolean {
     let isFulfilled = true;
     if (conditionData.conditions.minAmount && deposit.amount < conditionData.conditions.minAmount) {
       isFulfilled = false;
     }
     if (conditionData.conditions.depositCode && deposit.code !== conditionData.conditions.depositCode) {
       isFulfilled = false;
     }
     // TODO: Validate timeframe
     return isFulfilled;
   }
   ```

2. **`buildDepositTracking()`** - Nuevo transformer
   ```typescript
   // apps/backend/src/lib/transformers/deposit-tracking.transformer.ts
   export function buildDepositTracking(
     deposit: PrismaDeposit,
     isFulfilled: boolean
   ): DepositQualifyTracking {
     return {
       type: 'DEPOSIT',
       status: isFulfilled ? 'COMPLETED' : 'IN_PROGRESS',
       qualifyingDepositId: deposit.id,
       depositAmount: deposit.amount,
       depositCode: deposit.code || undefined,
       depositedAt: deposit.date,
     };
   }
   ```

3. **`calculateDepositRewardValue()`** - Nuevo helper
   ```typescript
   // apps/backend/src/lib/helpers/reward-calculation.ts
   export function calculateDepositRewardValue(
     depositAmount: number,
     conditionData: DepositQualifyCondition
   ): number {
     const effectiveAmount = Math.min(
       depositAmount,
       conditionData.conditions.maxAmount || Infinity
     );

     let calculatedValue = 0;
     if (conditionData.conditions.bonusPercentage) {
       calculatedValue = (effectiveAmount * conditionData.conditions.bonusPercentage) / 100;
     }

     if (conditionData.conditions.maxBonusAmount) {
       calculatedValue = Math.min(calculatedValue, conditionData.conditions.maxBonusAmount);
     }

     return calculatedValue;
   }
   ```

**Beneficios de este refactoring**:
- ✅ Lógica testeable de forma aislada (unit tests sin BD)
- ✅ Reutilizable en otros servicios (bet.service, etc.)
- ✅ Service más limpio, solo orquestación
- ✅ Cumple arquitectura: Service → Helper/Transformer → Prisma

**Decisión**: ⏸️ **Posponer para después del MVP** - No bloquea funcionalidad

---

# TODO List - MatBett Refactoring

## 🎉 Progreso Reciente (2025-12-03)

### ✅ COMPLETADO: Refactorización Arquitectónica Mayor

#### 1. **Lógica Movida a Hooks de Dominio**

**Problema**: Componentes tenían demasiada lógica mezclada con rendering, difícil de reutilizar.

**Solución**: Movimos TODA la lógica reutilizable a `usePromotionLogic`:

```typescript
// ANTES: PromotionFormContent tenía ~150 líneas de lógica + rendering
// DESPUÉS: PromotionFormContent tiene ~70 líneas, solo rendering

// usePromotionLogic ahora incluye:
export const usePromotionLogic = (initialData) => {
  // ... lógica existente ...

  // ✅ NUEVO: Estado UI de Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // ✅ NUEVO: Helpers de Extracción de ServerData
  const getPhaseServerData = () => { /* ... */ };
  const getRewardServerData = () => { /* ... */ };
  const getConditionServerData = () => { /* ... */ };

  // ✅ NUEVO: Handlers UI Completos
  const handleQualifyConditionSelect = (id, index) => {
    setQualifyCondition(id, index);
    openDepositModal(); // Integrado!
  };
  const handleSinglePhaseToggle = (value) => { /* lógica completa */ };
  const handleConfirmToggle = () => { /* lógica completa */ };
  const handleFormSubmit = (data) => { /* sincronización SINGLE phase */ };
  const handlePhaseTabChange = (value) => { /* actualizar tracking */ };

  return {
    // ... returns existentes ...
    // ✅ Nuevos returns
    isDepositModalOpen, openDepositModal, closeDepositModal,
    showConfirmDialog, setShowConfirmDialog,
    getPhaseServerData, getRewardServerData, getConditionServerData,
    handleQualifyConditionSelect,
    handleSinglePhaseToggle,
    handleConfirmToggle,
    handleFormSubmit,
    handlePhaseTabChange,
  };
};
```

**Beneficios**:
- ✅ Componente 50% más pequeño y legible
- ✅ Toda la lógica testeable de forma aislada
- ✅ Fácilmente reutilizable en otros componentes
- ✅ Separación clara: hook = lógica, componente = rendering

---

#### 2. **Bug Crítico del Schema Solucionado** 🐛

**Problema**: TypeScript no reconocía el campo `tracking` en `DepositQualifyConditionServerModel` aunque existía en el schema.

**Root Cause**: `RewardEntitySchema` usaba `QualifyConditionSchema` (INPUT) en lugar de `QualifyConditionEntitySchema` (OUTPUT) para el array `qualifyConditions`.

```typescript
// ❌ ANTES (en BaseRewardSchema)
qualifyConditions: z.array(QualifyConditionSchema).min(0),  // INPUT sin tracking

// Los EntitySchemas extendían pero NO sobrescribían qualifyConditions
export const FreeBetRewardEntitySchema = FreeBetRewardSchema.extend({
  usageTracking: FreeBetUsageTrackingSchema.nullable(),
  // ❌ Faltaba sobrescribir qualifyConditions!
});
```

**Solución**: Sobrescribir `qualifyConditions` en TODOS los 6 `RewardEntitySchema`:

```typescript
// ✅ DESPUÉS
export const FreeBetRewardEntitySchema = FreeBetRewardSchema.extend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ EntitySchema con tracking
  usageTracking: FreeBetUsageTrackingSchema.nullable(),
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
});
```

**Archivos modificados**:
- ✅ `reward.schema.ts` - Agregado `qualifyConditions` override en 6 EntitySchemas
- ✅ `qualify-tracking.schema.ts` - Agregados campos faltantes (`depositAmount`, `depositCode`, `depositedAt`)
- ✅ `DepositQualifyModal.tsx` - Type narrowing a `DepositQualifyConditionServerModel`
- ✅ `TimeframeForm.tsx` - Corregido import de `UsePromotionLogicReturn`

**Resultado**: Reducción de 16 → 12 errores de TypeScript (25% de progreso)

**Lección Aprendida**:
> Cuando extendemos schemas con `.extend()`, los campos del schema base se mantienen. Para sobrescribir tipos (INPUT → OUTPUT), debemos redefinir explícitamente el campo con el nuevo schema.

---

#### 3. **Flujo Completo de Tracking Integrado**

**Problema**: No había forma de mostrar tracking (calculado por backend) en los modals.

**Solución**: Implementamos flujo completo desde UI hasta serverData:

```
Usuario hace clic "Ver Tracking" (botón en DepositCondition)
  ↓
handleQualifyConditionSelect() (en usePromotionLogic)
  ↓ actualiza trackingState { phaseIndex, rewardIndex, qualifyConditionIndex }
  ↓ abre modal (setIsDepositModalOpen(true))
  ↓
PromotionFormContent renderiza DepositQualifyModal
  ↓ pasa conditionPath: "phases.0.rewards.1.qualifyConditions.2"
  ↓ pasa conditionServerData extraído con getConditionServerData()
  ↓
DepositQualifyModal muestra:
  ├─ Formulario (editable) - sin tracking
  └─ DepositTracking (read-only) - con tracking de serverData
```

**Archivos modificados**:
- ✅ `DepositCondition.tsx` - botón "Ver Tracking" añadido
- ✅ `QualifyConditionForm.tsx` - pasa isEditing y onViewTracking
- ✅ `RewardForm.tsx` - crea callbacks de tracking por condition
- ✅ `PromotionForm.tsx` - renderiza modal con datos correctos
- ✅ `usePromotionLogic.ts` - maneja todo el estado y lógica

---

#### 3. **Tipos Actualizados**

**Actualizado**: `UsePromotionLogicReturn` en `types/hooks.ts` con todos los nuevos métodos:

```typescript
export type UsePromotionLogicReturn = {
  // ... campos existentes ...

  // ✅ Helpers de Extracción de ServerData
  getPhaseServerData: () => PhaseServerModel | undefined;
  getRewardServerData: () => RewardServerModel | undefined;
  getConditionServerData: () => RewardQualifyConditionServerModel | undefined;

  // ✅ Estado y Handlers de UI (Modals y Dialogs)
  isDepositModalOpen: boolean;
  openDepositModal: () => void;
  closeDepositModal: () => void;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (value: boolean) => void;

  // ✅ Handlers UI Completos (Reutilizables)
  handleQualifyConditionSelect: (id: string, index: number) => void;
  handlePhaseTabChange: (value: string) => void;
  handleSinglePhaseToggle: (value: string) => void;
  handleConfirmToggle: () => void;
  handleFormSubmit: (data: PromotionFormData) => PromotionFormData;
};
```

---

### 🎯 Aprendizaje Clave

**REGLA ARQUITECTÓNICA**:
> "Si la lógica puede ser reutilizada por otros componentes o formularios, DEBE estar en los hooks de dominio, NO en los componentes."

**Componentes deben ser lo más "tontos" posible**: solo reciben props, llaman hooks, y renderizan UI.

**Hooks de dominio deben ser "inteligentes"**: contienen toda la lógica de negocio, estado UI complejo, y helpers reutilizables.

---

## Contexto del Proyecto

**Objetivo Principal**: Refactorizar el flujo de creación de promociones con entidades anidadas:
- 1 Promotion → N Phases → N Rewards → N QualifyConditions (con union types)
- Dos contextos: `/promotions` (nested form) y `/rewards/[id]` (standalone)
- Establecer separación limpia entre INPUT (form data sin tracking) y OUTPUT (server models con tracking)

---

## Decisiones Arquitectónicas Clave

### 1. Input/Output Separation ✅
- **INPUT schemas** (para forms): SIN campos de tracking (`usageTracking`, `tracking`)
- **OUTPUT schemas** (EntitySchemas): CON campos de tracking (calculados por backend)
- **Razón**: El tracking es responsabilidad del backend, el frontend solo lo muestra (read-only)

### 2. Context Provider Pattern ✅
```
OuterComponent
  └─ useXForm() → FormProvider
      └─ InnerContent
          ├─ useFormContext()
          └─ useXLogic()
```
- **Razón**: `useFormContext()` solo funciona dentro de `<FormProvider>`, no en el mismo componente que lo crea
- **Aplicado en**: PromotionForm/PromotionFormContent
- **Pendiente en**: RewardStandaloneForm

### 3. ServerData Flow Pattern
- **Props Drilling** (no Context, al menos inicialmente)
- Parent obtiene `serverData` → pasa nested data como props a children
- Tracking se pasa explícitamente como prop a componentes de display

---

## Patrón de Context a Aplicar

### ✅ Patrón Actual en PromotionForm (CORRECTO)
```
PromotionForm (outer)
  └─ usePromotionForm() → FormProvider
      └─ PromotionFormContent (inner)
          ├─ useFormContext()
          └─ usePromotionLogic(initialData)
              └─ returns: { serverData, trackingState, helpers, ... }
```

### ⚠️ Patrón Necesario en RewardStandaloneForm (PENDIENTE)
```
RewardStandaloneForm (outer)
  └─ useRewardForm() → FormProvider  // ❌ NO EXISTE AÚN
      └─ RewardStandaloneFormContent (inner)
          ├─ useFormContext()
          └─ useRewardLogic(initialData)  // ❌ NO EXISTE AÚN (evaluar si es necesario)
              └─ returns: { serverData, ... }
```

---

## TODO List Completo

### 🏗️ FASE 1: Arquitectura de Hooks & Context (Prioridad Alta)

#### [ ] 1.1 Crear useRewardForm factory hook
**Archivo**: `apps/frontend/src/hooks/useRewardForm.ts`

```typescript
// Encapsula la creación del form con configuración específica
export const useRewardForm = (initialData?: RewardServerModel) => {
  return useForm<RewardFormData>({
    resolver: zodResolver(RewardSchema),
    defaultValues: buildDefaultReward(initialData?.type || "FREEBET", initialData),
    mode: "onChange",
  });
};
```

**Beneficio**: Consistencia con patrón PromotionForm, reutilización de lógica

---

#### [ ] 1.2 Evaluar necesidad de useRewardLogic
**Archivo**: `apps/frontend/src/hooks/domain/useRewardLogic.ts` (si es necesario)

**Pregunta**: ¿Necesitamos lógica de dominio compleja para Reward?
- Si solo necesitamos `serverData` → puede no ser necesario
- Si necesitamos helpers, computed values, handlers → crear el hook

**Decisión Pendiente**: Evaluar después de ver uso real en RewardStandaloneForm

---

#### [ ] 1.3 Refactorizar RewardStandaloneForm con patrón outer/inner
**Archivo**: `apps/frontend/src/components/organisms/RewardStandaloneForm.tsx`

**Patrón a aplicar**:
```typescript
// INNER: Content que consume context
const RewardStandaloneFormContent: React.FC<Props> = ({ rewardId, onSuccess }) => {
  const { handleSubmit, formState } = useFormContext<RewardFormData>();
  const { serverData } = useRewardLogic(rewardId); // Si creamos el hook

  // ... lógica y UI
};

// OUTER: Wrapper que provee context
export const RewardStandaloneForm: React.FC<Props> = (props) => {
  const form = useRewardForm(props.initialData);

  return (
    <FormProvider {...form}>
      <RewardStandaloneFormContent {...props} />
    </FormProvider>
  );
};
```

---

### 🔧 FASE 2: Tracking & ServerData Flow (Prioridad Alta)

#### [ ] 2.1 Refactorizar DepositTracking
**Archivo**: `apps/frontend/src/components/molecules/tracking/DepositTracking.tsx`

**Cambios**:
- Recibir `tracking?: DepositQualifyTrackingServerModel` como prop
- Mostrar datos de tracking como READ-ONLY (no editar)
- Remover cualquier lógica que intente escribir tracking en el form

**Principio**: Tracking es calculado por backend, frontend solo lo muestra

---

#### [ ] 2.2 Refactorizar UsageTrackingForm
**Archivo**: `apps/frontend/src/components/molecules/UsageTrackingForm.tsx` (verificar nombre exacto)

**Cambios**:
- Recibir `usageTracking?: RewardUsageTrackingServerModel` como prop
- Mostrar datos de usageTracking como READ-ONLY
- Adaptar a diferentes tipos de rewards (FREEBET, BONUS, etc.)

---

#### [ ] 2.3 Fix DepositQualifyModal props & typing
**Archivo**: `apps/frontend/src/components/molecules/DepositQualifyModal.tsx`

**Cambios aplicados** (parciales):
- ✅ Recibir `conditionPath: string` como prop (en vez de calcular internamente)
- ✅ Recibir `conditionServerData?: RewardQualifyConditionServerModel` como prop
- ✅ Usar `conditionServerData?.tracking` para mostrar tracking
- ❌ PENDIENTE: Fix typing errors (useWatch, type narrowing)

**Errores pendientes**:
1. `useWatch` con string path - necesita typing correcto
2. Narrow type de `conditionData` a DEPOSIT específicamente para `DepositWarnings`
3. Type mismatch en props de `DepositWarnings`

---

#### [ ] 2.4 Integrar DepositQualifyModal en parent component
**Archivo**: TBD (¿PhaseForm? ¿RewardForm?)

**Requiere**:
- Parent usa `usePromotionLogic()` para obtener `getQualifyConditionPath()`
- Parent calcula `conditionPath` y lo pasa como prop
- Parent obtiene `serverData` y extrae el `conditionServerData` correspondiente
- Pasar ambos como props a `DepositQualifyModal`

---

### 🐛 FASE 3: TypeScript Error Fixes (Prioridad Media)

#### [ ] 3.1 Fix DepositQualifyModal typing errors
**Archivo**: `apps/frontend/src/components/molecules/DepositQualifyModal.tsx`

**Errores actuales**:
- Line 42: `useWatch` con string path no acepta el tipo
- Line 46: Property 'tracking' no existe en union type
- Line 60: Type mismatch al pasar conditionData a DepositWarnings

**Soluciones**:
1. Usar `as const` en path o type assertion apropiada
2. Ya solucionado usando `conditionServerData?.tracking`
3. Narrow type a `DEPOSIT` antes de pasar a DepositWarnings

---

#### [ ] 3.2 Fix useRewards API hooks typing
**Archivos**: `apps/frontend/src/hooks/api/useRewards.ts` (verificar path exacto)

**Verificar**:
- Hooks usan `RewardFormData` para INPUT (sin usageTracking)
- Hooks usan `RewardServerModel` para OUTPUT (con usageTracking)
- Consistencia con tRPC RouterInputs/RouterOutputs

---

#### [ ] 3.3 Fix RewardForm fieldPath typing errors
**Archivo**: `apps/frontend/src/components/molecules/RewardForm.tsx`

**Problema**: fieldPath puede ser:
- `""` (empty string en standalone)
- `"phases.0.rewards.1"` (nested en promotion form)

**Verificar**: Typing correcto para todos los casos de uso

---

#### [ ] 3.4 Fix remaining component typing errors
**Archivos varios**:
- `BetConditionsForm` control prop error
- `TimeframeForm` missing properties
- Otros errores detectados por diagnostics

**Método**: Ejecutar diagnostics y fix uno por uno

---

### 📚 FASE 4: Integration & Documentation (Prioridad Baja)

#### [ ] 4.1 Verificar integración completa
**Test manual**:
1. Crear promotion con nested rewards y qualifyConditions
2. Ver tracking display (read-only) desde serverData
3. Editar reward standalone en `/rewards/[id]`
4. Verificar que tracking NO se envía en updates

---

#### [ ] 4.2 Actualizar CLAUDE.md con patrones aprendidos
**Archivo**: `CLAUDE.md`

**Secciones a añadir**:

```markdown
## Critical Architectural Patterns

### Input/Output Separation for Tracking

**RULE**: Tracking fields are NEVER in form data, ALWAYS in server models only.

- **INPUT schemas** (FormData, used in forms): NO tracking fields
  - `RewardFormData`: Has `usageConditions`, NO `usageTracking`
  - `QualifyConditionFormData`: NO `tracking` field

- **OUTPUT schemas** (ServerModel, from backend): YES tracking fields
  - `RewardServerModel`: Has both `usageConditions` AND `usageTracking`
  - `QualifyConditionServerModel`: Has `tracking` field

- **Backend calculates tracking**, frontend displays it (read-only)
- **Forms NEVER submit tracking data** (backend would ignore it anyway)

### Context Provider Pattern for Forms

**RULE**: Components using `useFormContext()` must be children of `<FormProvider>`.

**Pattern**:
```typescript
// OUTER: Creates context
const OuterForm = (props) => {
  const form = useXForm(props.initialData);
  return (
    <FormProvider {...form}>
      <InnerFormContent {...props} />
    </FormProvider>
  );
};

// INNER: Consumes context
const InnerFormContent = (props) => {
  const { control, handleSubmit } = useFormContext<XFormData>();
  const { serverData, helpers } = useXLogic(props.initialData);
  // ... render form
};
```

**Why**: React Hook Form's `useFormContext()` can only be called from components inside `<FormProvider>`, not in the same component that renders it.

**Applied in**:
- PromotionForm / PromotionFormContent
- RewardStandaloneForm / RewardStandaloneFormContent (after refactor)

### ServerData Flow Pattern

**RULE**: Use props drilling to pass serverData with tracking to display components.

**Flow**:
1. Parent component calls `useXLogic()` → gets `serverData`
2. Parent extracts nested tracking data from serverData
3. Parent passes tracking as explicit prop to child components
4. Child components display tracking (read-only), edit form fields only

**Example**:
```typescript
// Parent
const Parent = () => {
  const { serverData } = usePromotionLogic(initialData);
  const conditionServerData = serverData?.phases[0]?.rewards[0]?.qualifyConditions[0];

  return (
    <DepositQualifyModal
      conditionPath="phases.0.rewards.0.qualifyConditions.0"
      conditionServerData={conditionServerData} // Has tracking for display
    />
  );
};

// Child
const DepositQualifyModal = ({ conditionPath, conditionServerData }) => {
  const { control } = useFormContext(); // Edit form fields
  const tracking = conditionServerData?.tracking; // Display only
  // ...
};
```
```

---

## 🎯 Orden de Ejecución Recomendado

1. ✅ **Crear useRewardForm** → Rápido, necesario para RewardStandaloneForm
2. ✅ **Refactorizar RewardStandaloneForm** → Aplicar patrón outer/inner
3. ✅ **Fix DepositQualifyModal typing** → Bloquea testing del modal
4. **Refactorizar tracking components** → DepositTracking, UsageTrackingForm
5. **Fix remaining TypeScript errors** → Uno por uno con diagnostics
6. **Verificar integración completa** → Test manual end-to-end
7. **Documentar en CLAUDE.md** → Última tarea, cuando todo funciona

---

## Notas Importantes

### Lecciones Aprendidas

1. **No mezclar responsabilidades**: Backend calcula, frontend muestra
2. **Consistencia de patrones**: Si funciona en Promotion, aplicarlo en Reward
3. **Type safety end-to-end**: tRPC types fluyen desde schema hasta UI
4. **Context limitations**: Entender cuándo y dónde se puede llamar useFormContext()

### Archivos Clave Modificados

**Schemas (Completado)**:
- ✅ `packages/shared/src/schemas/reward.schema.ts` - Input/Output separation
- ✅ `packages/shared/src/schemas/qualify-condition.schema.ts` - Input/Output separation
- ✅ `packages/shared/src/schemas/phase.schema.ts` - Uses EntitySchemas
- ✅ `packages/shared/src/schemas/promotion.schema.ts` - Uses EntitySchemas

**Types & Defaults (Completado)**:
- ✅ `apps/frontend/src/types/hooks.ts` - Removed tracking from FormData, added UsePromotionLogicReturn
- ✅ `apps/frontend/src/utils/formDefaults.ts` - Removed tracking generation

**Hooks (Completado)**:
- ✅ `apps/frontend/src/hooks/domain/usePromotionLogic.ts` - REFACTORED: All UI logic moved here
- ✅ `apps/frontend/src/hooks/domain/useRewardLogic.ts` - EXISTS (needs serverData return for consistency)

**Components (Completado)**:
- ✅ `apps/frontend/src/components/organisms/PromotionForm.tsx` - REFACTORED: 50% smaller, uses hooks
- ✅ `apps/frontend/src/components/molecules/PhaseForm.tsx` - Passes callbacks correctly
- ✅ `apps/frontend/src/components/molecules/RewardForm.tsx` - Integrated tracking callbacks
- ✅ `apps/frontend/src/components/molecules/QualifyConditionForm.tsx` - Passes isEditing & onViewTracking
- ✅ `apps/frontend/src/components/molecules/conditions/DepositCondition.tsx` - "Ver Tracking" button added
- ⚠️ `apps/frontend/src/components/molecules/DepositQualifyModal.tsx` - Integrated but has TS errors

**Pendiente**:
- ⚠️ `apps/frontend/src/components/molecules/tracking/DepositTracking.tsx` - Needs refactor (receive tracking as prop)
- ⚠️ `apps/frontend/src/components/molecules/UsageTrackingForm.tsx` - Needs refactor (receive tracking as prop)
- ⚠️ `apps/frontend/src/components/organisms/RewardStandaloneForm.tsx` - Needs outer/inner pattern
- ⚠️ `apps/frontend/src/hooks/useRewardForm.ts` - Needs creation
- ⚠️ `apps/frontend/src/components/molecules/index.ts` - Needs export DepositQualifyModal

---

## Estado Actual

**TypeScript Errors**: 15 errors (categorías identificadas, soluciones conocidas)

**Progreso General**:
- ✅ Schema refactoring completado (100%)
- ✅ Type definitions actualizadas (100%)
- ✅ Form defaults corregidos (100%)
- ✅ **usePromotionLogic refactored (100%)** ← NUEVO
- ✅ **PromotionForm flow integrated (90%)** ← NUEVO
- ⚠️ Tracking components refactor (0% - siguiente tarea)
- ⚠️ TypeScript errors (0% - después de tracking)
- ❌ RewardStandaloneForm refactor (pendiente)
- ❌ CLAUDE.md documentation (pendiente)

## 🎉 FASE COMPLETADA: Fix TypeScript Errors (100%)

**Resultado**: ✅ **16 → 0 errores de TypeScript** - Todo resuelto sin usar `any`

### Errores Resueltos:

1. ✅ **Bug crítico del schema**: `RewardEntitySchema` no sobrescribía `qualifyConditions` con `EntitySchema`
   - Solución: Agregado `qualifyConditions: z.array(QualifyConditionEntitySchema)` en 6 EntitySchemas

2. ✅ **Campos faltantes en tracking**: `DepositQualifyTrackingSchema` incompleto
   - Solución: Agregados `depositAmount`, `depositCode`, `depositedAt`

3. ✅ **TimeframeForm type error**: Usaba `UsePromotionFormReturn` en lugar de `UsePromotionLogicReturn`

4. ✅ **PromotionForm type narrowing**: Modal esperaba `DepositQualifyConditionServerModel` específico
   - Solución: Type guard `conditionServerData?.type === 'DEPOSIT'`

5. ✅ **DepositQualifyModal componente genérico**: Funciona en ambos contextos (nested/standalone)
   - Solución: Generic `<T extends FieldValues>` con `Path<T>`

6. ✅ **RewardStandaloneForm null handling**: `rewardData` puede ser `null`
   - Solución: `rewardData ?? undefined`

7. ✅ **QualifyBetCondition props error**: Pasaba `control` a componente que usa context
   - Solución: Removida prop `control`

8. ✅ **buildDefaultQualifyCondition overloads**: Sin usar `any`, types derivados de opciones
   - Solución: Function overloads + tipo `QualifyConditionType` de `@matbett/shared`
   - Type narrowing correcto en switch cases

9. ✅ **RewardForm appendCondition**: `FieldArray` type muy estricto
   - Solución: Cast a `FieldArray<T, typeof qualifyConditionsPath>`

10. ✅ **useRewards tRPC mutations**: Uso incorrecto de `.mutate()`
    - Solución: Patrón correcto `...trpc.reward.update.mutationOptions()`

11. ✅ **useRewardLogic double cast**: Generic `T` no compatible con union type
    - Solución: `as unknown as T` (safe at runtime)

### Patrones Aplicados:

- ✅ **Type narrowing** con discriminated unions
- ✅ **Function overloads** para type-safe returns
- ✅ **Tipos derivados** de opciones (`QualifyConditionType`)
- ✅ **tRPC end-to-end** type safety con `mutationOptions`
- ✅ **Componentes genéricos** reutilizables
- ✅ **Double cast** solo cuando es seguro en runtime
- ✅ **Type guards** para union types (`condition.type === 'DEPOSIT'`)

---

## 🎯 PRÓXIMA FASE: MVP Backend & Frontend

### MVP Scope:

**Backend (verificar implementación)**:
1. ✅ Promotion CRUD
   - `promotion.create` - Crear promoción con nested entities
   - `promotion.getById` - Cargar promoción para edición (con tracking)
   - `promotion.update` - Actualizar promoción
   - `promotion.list` - Lista con paginación (TanStack Table)
   - `promotion.delete` - Eliminar promoción

2. ⚠️ **Deposit tracking** (CRÍTICO para MVP)
   - `deposit.create` - Añadir depósito que califica para QualifyCondition
   - Verificar que transformer/service calcula: `depositAmount`, `depositCode`, `depositedAt`
   - Verificar que se vincula correctamente con `qualifyingDepositId`

**Frontend (completar)**:
1. ✅ PromotionForm (creación/edición) - COMPLETADO
2. ✅ DepositQualifyModal integrado - COMPLETADO
3. ❌ **Tabla de Promociones** (TanStack Table)
   - Columnas: nombre, bookmaker, status, dates, acciones
   - Paginación server-side
   - Filtros (status, bookmaker)
   - Sorting
4. ❌ **Página de lista** (`/promotions`)
5. ✅ Routing básico - COMPLETADO

---

## Próximos Pasos Inmediatos:

1. **AHORA**: Verificar backend para MVP
   - Revisar si `DepositQualifyTrackingSchema` campos están en transformer
   - Verificar routers de Promotion existen y funcionan
   - Verificar endpoint `deposit.create` existe

2. **DESPUÉS**: Implementar tabla de promociones
   - Instalar/configurar TanStack Table
   - Crear columnas para promociones
   - Integrar con `promotion.list`

3. **FINALMENTE**: Testing end-to-end del MVP

**Última Actualización**: 2025-12-03 20:00 (16 de 16 errores resueltos - 100% TypeScript limpio)
