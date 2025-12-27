# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MatBett** is a full-stack TypeScript monorepo for matched betting tracking, built with tRPC, Prisma, and Next.js. The architecture emphasizes type safety, atomic persistence, and a clear separation between frontend, backend, and shared contracts.

## Monorepo Structure

```
matbett/
├── apps/
│   ├── backend/          # Express + Prisma + tRPC Server
│   └── frontend/         # Next.js 15 + React 19 + TanStack Query
└── packages/
    ├── shared/           # Zod schemas (Source of Truth)
    └── api/              # tRPC contract (routers & types)
```

## Essential Commands

### Development
```bash
# Start entire stack (frontend + backend in parallel)
pnpm dev

# Start individual apps
pnpm dev:frontend
pnpm dev:backend
```

### Database (from apps/backend)
```bash
# Start PostgreSQL via Docker
pnpm docker:up

# Apply schema changes and create migration
pnpm prisma:migrate

# Regenerate Prisma client (run after schema changes)
pnpm prisma:generate

# Open Prisma Studio (database GUI)
pnpm prisma:studio

# Reset database (destructive - deletes all data)
pnpm prisma:reset
```

### Type Checking & Linting
```bash
# Type check entire monorepo
pnpm ts

# Type check specific app (from app directory)
pnpm ts

# Lint all packages
pnpm lint

# Format all code
pnpm format
```

### Building
```bash
# Build all packages and apps
pnpm build

# Build specific app
pnpm build:frontend
pnpm build:backend
```

## Architectural Principles

### 1. Single Source of Truth
- **ALL** Zod schemas live in `packages/shared`
- Both frontend and backend import from `@matbett/shared`
- Prisma schema adapts to Zod schemas, NOT the reverse
- Never duplicate type definitions across packages

### 2. Type Safety End-to-End
- Frontend infers types from backend via tRPC
- Use `RouterInputs` and `RouterOutputs` from `@/lib/trpc`
- Never define manual interfaces for API types
- Strict TypeScript mode - `any` is prohibited

### 3. Application-Side IDs Pattern
- Backend generates IDs (`cuid2`) **before** database insertion
- Enables building complete object graphs in memory
- Single atomic transaction instead of sequential inserts
- See `docs/PROMOTION_LOGIC.md` for detailed explanation

### 4. Layered Backend Architecture

```
tRPC Router → Service → Repository → Prisma
     ↓           ↓
   Context   Transformer (ID generation, hashing)
```

- **Transformers** (`src/lib/transformers/`): Convert DTOs to Prisma payloads, generate IDs, calculate hashes
- **Services** (`src/services/`): Business logic, validation, orchestration
- **Repositories** (`src/repositories/`): Pure data access, Prisma wrappers
- **Routers** (in `@matbett/api`): Define API contract, delegate to services

### 5. Atomic Persistence with Nested Writes
- Complex entities (Promotions with Phases/Rewards/Conditions) use nested writes
- Transformer builds complete payload with IDs and connections in memory
- Single `prisma.create()` call handles entire transaction
- Deduplication via hash maps (`fast-json-stable-stringify`)

### 6. Date Handling
- Use native `Date` objects everywhere
- `superjson` serializes/deserializes automatically in tRPC
- Never manually convert to ISO strings for transmission

## Critical Rules

### DO (Always)
1. Define schemas in `packages/shared` before implementation
2. Use `discriminatedUnion` for polymorphic entities (Rewards, Conditions)
3. Handle null/undefined correctly:
   - `.nullish()` for optional Prisma fields (`String?`)
   - `.nullable()` for nullable fields (`DateTime?`)
   - `.optional()` for form fields that can be omitted
4. Generate IDs in transformers using `createId()` from `@paralleldrive/cuid2`
5. Parse JSON fields from Prisma with appropriate Zod schemas
6. Use safety helpers (e.g., `getConditionIdOrThrow`) instead of `!` assertions
7. Import via workspace packages: `@matbett/shared`, `@matbett/api`

### DON'T (Never)
1. Import backend code directly in frontend (use `@matbett/api`)
2. Use `any` type (ESLint configured to error)
3. Duplicate schemas between packages
4. Use sequential inserts with loops for nested data
5. Manually manage transactions (prefer nested writes)
6. Modify code without reading the file first
7. Convert dates to strings manually (let `superjson` handle it)

## Development Workflow for New Features

```
1. packages/shared     → Define/modify Zod schemas
2. apps/backend        → Update schema.prisma, run migration
3. apps/backend        → Create/update transformers
4. apps/backend        → Implement repository & service
5. packages/api        → Define tRPC procedures
6. apps/frontend       → Consume via tRPC hooks
```

## Complex Business Logic

**Promotion CRUD**: Application-Side IDs pattern with nested writes and hash-based deduplication. Full explanation in `docs/PROMOTION_LOGIC.md`.

## Tech Stack Reference

- **Backend**: Express 5, tRPC v11, Prisma 7, PostgreSQL 16
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4, Shadcn/ui
- **Validation**: Zod 4.1.12
- **State Management**: TanStack Query v5
- **Forms**: React Hook Form + Zod Resolver
- **ID Generation**: `@paralleldrive/cuid2`
- **Serialization**: `superjson`, `fast-json-stable-stringify`

## Key Documentation Files

- `README.md`: Project overview and quick start
- `docs/PROMOTION_LOGIC.md`: Detailed explanation of atomic persistence pattern
- `apps/backend/README.md`: Backend architecture and layer responsibilities
- `apps/frontend/README.md`: Frontend patterns, form handling, UI architecture
- `packages/api/README.md`: tRPC contract definition and usage
- `packages/shared/README.md`: Schema conventions and composition patterns
- `GEMINI.md`: Extended AI instructions (contains additional operational guidelines)

## Common Pitfalls

1. **Forgetting to run `prisma generate`** after schema changes → TypeScript errors
2. **Importing relative paths** between packages → Use workspace names
3. **Not reading files before editing** → String replacement failures
4. **Assuming nested objects have IDs** → Check for ID presence to distinguish create vs update
5. **Mixing layer responsibilities** → Keep business logic in services, not routers or repositories

## Patterns Learned (December 2025)

### TypeScript Type Safety Patterns

#### 1. Function Overloads for Discriminated Unions
**Problem**: Building default values for discriminated unions while maintaining type safety.

**Solution**: Use function overloads with literal types:
```typescript
// Import union type from shared options
import { type QualifyConditionType } from '@matbett/shared';

// Overload for each specific type
export function buildDefaultQualifyCondition(
  type: "DEPOSIT",
  conditionData?: RewardQualifyConditionServerModel
): Extract<RewardQualifyConditionFormData, { type: "DEPOSIT" }>;

export function buildDefaultQualifyCondition(
  type: "BET",
  conditionData?: RewardQualifyConditionServerModel
): Extract<RewardQualifyConditionFormData, { type: "BET" }>;

// General overload for union type (for mapping)
export function buildDefaultQualifyCondition(
  type: QualifyConditionType,
  conditionData?: RewardQualifyConditionServerModel
): RewardQualifyConditionFormData;

// Implementation with type narrowing
export function buildDefaultQualifyCondition(
  type: QualifyConditionType,
  conditionData?: RewardQualifyConditionServerModel
): RewardQualifyConditionFormData {
  switch (type) {
    case 'DEPOSIT': {
      const depositConditions = conditionData && conditionData.type === 'DEPOSIT'
        ? conditionData.conditions
        : undefined;
      return { type: 'DEPOSIT', ...baseCondition, conditions: {...} };
    }
    // ... other cases
  }
}
```

**Key Points**:
- Types derived from shared options (not hardcoded strings)
- Type narrowing with discriminated union guards
- Extract utility for specific return types

#### 2. Entity vs Schema Separation
**Problem**: Confusing INPUT schemas (form data) with OUTPUT schemas (from database).

**Solution**: Clear naming convention:
```typescript
// INPUT - User submits, no tracking/timestamps
export const DepositQualifyConditionSchema = z.object({
  type: z.literal('DEPOSIT'),
  conditions: DepositConditionsSchema,
  // No tracking, no timestamps
});

// OUTPUT - Backend returns, includes tracking/timestamps
export const DepositQualifyConditionEntitySchema = DepositQualifyConditionSchema.extend({
  tracking: DepositQualifyTrackingSchema.nullable(),
  ...QualifyConditionEntityCommonFieldsSchema.shape,
  ...QualifyConditionStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
});
```

**Critical Rule**:
- Transformers MUST use `EntitySchema` for arrays that include tracking
- Frontend form defaults use `Schema` (INPUT)
- Backend responses use `EntitySchema` (OUTPUT)

#### 3. Timestamp Nullability Pattern
**Problem**: TypeScript difference between `undefined` (optional) and `null` (nullable).

**Solution**: Use `null` for database-sourced optional dates:
```typescript
// ❌ WRONG - EntitySchemas expect Date | null
qualifyConditionsFulfilledAt: prismaReward.qualifyConditionsFulfilledAt ?? undefined,

// ✅ CORRECT
qualifyConditionsFulfilledAt: prismaReward.qualifyConditionsFulfilledAt ?? null,
```

**Rule**: Database optional fields → `null`, Form optional fields → `undefined`

#### 4. Prisma JSON Field Handling
**Problem**: Prisma JSON fields need special null handling.

**Solution**: Use `Prisma.DbNull` instead of JavaScript `null`:
```typescript
// ❌ WRONG
usageConditions: reward.usageConditions ?? null,

// ✅ CORRECT
usageConditions: reward.usageConditions ?? Prisma.DbNull,
```

### React Hook Form Patterns

#### 5. Generic Form Components with Context
**Problem**: Reusable form components need type-safe field paths.

**Solution**: Generic components with `useFormContext`:
```typescript
export function RewardForm<T extends FieldValues>({
  fieldPath, // Can be "" for root or "phases.0.rewards.1" for nested
}: RewardFormProps<T>) {
  // Get context instead of passing form as prop
  const { setValue, getValues, control } = useFormContext<T>();

  // Helper for building paths
  const getPath = useCallback((field: string) => {
    return fieldPath ? `${fieldPath}.${field}` : field;
  }, [fieldPath]);

  // Use paths with proper typing
  const rewardType = useWatch({
    control,
    name: getPath("type") as Path<T>,
  });
}
```

**Key Points**:
- Empty string `""` for root-level forms
- Nested paths like `"phases.0.rewards.1"` for nested forms
- `getPath` helper for consistent path building

#### 6. Double Cast for Generic Reset
**Problem**: TypeScript can't infer union to generic conversion.

**Solution**: Double cast through `unknown`:
```typescript
// When basePath is empty (root form)
if (basePath === "") {
  // Double cast: RewardFormData (union) -> unknown -> T (generic)
  // Safe at runtime because T is always RewardFormData when basePath is ""
  reset(newRewardData as unknown as T);
}
```

**Rule**: Only use for safe runtime conversions where TypeScript can't infer.

### Backend Architecture Patterns

#### 7. Transformer Responsibility Separation
**What Transformers Should Do**:
- Generate IDs (`createId()`)
- Convert DTOs to Prisma payloads
- Parse JSON fields with Zod schemas
- Build tracking data structures

**What Services Should Do**:
- Business logic orchestration
- Database transactions
- Validation (using transformer helpers)
- Side effects (balance updates, etc.)

**Anti-pattern Found**:
```typescript
// ❌ WRONG - Business logic in service
const isFulfilled =
  data.amount >= conditionData.minAmount &&
  data.code === conditionData.depositCode;

const trackingData = {
  type: 'DEPOSIT',
  status: isFulfilled ? 'COMPLETED' : 'IN_PROGRESS',
  // ...
};
```

**Correct Approach**:
```typescript
// ✅ CORRECT - Helper for validation
import { validateDepositFulfillment } from '@/lib/helpers/deposit-validation';
import { buildDepositTracking } from '@/lib/transformers/deposit-tracking.transformer';

const isFulfilled = validateDepositFulfillment(data, conditionData);
const trackingData = buildDepositTracking(newDeposit, isFulfilled);
```

#### 8. Avoid Duplicate Exports
**Problem**: Multiple transformers exporting same function name.

**Solution**: Single source of truth + shared imports:
```typescript
// ✅ qualify-condition.transformer.ts (single source)
export function extractQualifyConditions(qc: QualifyCondition): Prisma.InputJsonValue {
  // implementation
}

// ✅ promotion.transformer.ts (import, don't duplicate)
import { extractQualifyConditions } from './qualify-condition.transformer';

// ✅ reward.transformer.ts (import, don't duplicate)
import { extractQualifyConditions } from './qualify-condition.transformer';
```

### tRPC Patterns

#### 9. Implicit Type Inference with mutationOptions
**Pattern**: Use tRPC's `mutationOptions` for automatic typing:
```typescript
// ❌ WRONG - Manual typing
return useMutation({
  mutationFn: (input: UpdateRewardInput) => trpc.reward.update.mutate(input),
});

// ✅ CORRECT - Automatic typing from router
return useMutation({
  ...trpc.reward.update.mutationOptions({
    onSuccess: (result, variables) => {
      // result and variables are automatically typed
    }
  }),
});
```

**Benefit**: End-to-end type safety from backend router to frontend hook.

### Schema Design Patterns

#### 10. Discriminated Union Override in Extensions
**Problem**: Base schema has INPUT array, entity needs OUTPUT array with tracking.

**Solution**: Override field in `.extend()`:
```typescript
// Base (for INPUT)
const BaseRewardSchema = z.object({
  qualifyConditions: z.array(QualifyConditionSchema), // INPUT
  // ...
});

// Entity (for OUTPUT) - MUST override
export const FreeBetRewardEntitySchema = FreeBetRewardSchema.extend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ OUTPUT with tracking
  usageTracking: FreeBetUsageTrackingSchema.nullable(),
  // ...
});
```

**Critical**: If you don't override, TypeScript won't see tracking fields!

### Frontend Component Architecture Patterns

#### 11. Generic Form Components - When to Use Generics
**Problem**: Determining when a form component should be generic vs hardcoded to a specific form type.

**Analysis Framework**:
Ask these questions:
1. **Multiple Form Contexts?** - Is the component used in different form types?
2. **Different Parent Types?** - Do parent components have different generic types?
3. **Type Safety Required?** - Do child components need type-safe field paths?

**Decision Matrix**:

| Component | Generic? | Reason |
|-----------|----------|--------|
| `PromotionForm` | ❌ No | Always uses `PromotionFormData` |
| `PhaseForm` | ❌ No | Always nested in `PromotionFormData` |
| `RewardForm` | ✅ Yes | Used in both `PromotionFormData` (nested) and `RewardFormData` (standalone) |
| `UsageConditionsForm` | ✅ Yes | Follows parent's generic type |
| `TimeframeForm` | ✅ Yes | Used in Promotion, Phase, and Reward contexts |

**Implementation Pattern**:
```typescript
// ✅ Generic component with default type
export function TimeframeForm<T extends FieldValues = PromotionFormData>({
  basePath,
  availableTimeframes,
}: TimeframeFormProps<T>) {
  const formContext = useFormContext<T>();
  const { control } = formContext;

  // All fields use generic type
  return (
    <SelectField<T>
      name={`${basePath}.mode` as Path<T>}
      // ...
    />
  );
}

// Usage in non-generic parent (PhaseForm)
<TimeframeForm<PromotionFormData>  // ✅ Explicit type
  basePath={`${fieldPrefix}timeframe` as Path<PromotionFormData>}
/>

// Usage in generic parent (UsageConditionsForm<T>)
<TimeframeForm<T>  // ✅ Pass through generic
  basePath={`${basePath}.timeframe` as Path<T>}
/>
```

**Key Points**:
- Default to specific type for retrocompatibility (e.g., `= PromotionFormData`)
- Non-generic parents specify type explicitly
- Generic parents pass through their generic type
- All internal fields and hooks must use the generic `<T>`

#### 12. Cascading Generics in Hooks
**Problem**: When a generic component uses a hook, that hook must also be generic.

**Example - useTimeframeFormLogic** (formerly `useTimeframeAnchorOptions`, now consolidated):
```typescript
// ❌ WRONG - Hardcoded type breaks generic component
export function useTimeframeAnchorOptions(
  control: Control<PromotionFormData>,  // ❌ Not generic
  basePath: string,
  availableTimeframes: AvailableTimeframes | undefined
) {
  const entityType = useWatch({
    control,
    name: `${basePath}.anchor.entityType` as FieldPath<PromotionFormData>,  // ❌
  });
  // ...
}

// ✅ CORRECT - Generic hook with default
export function useTimeframeAnchorOptions<T extends FieldValues = PromotionFormData>(
  control: Control<T>,  // ✅ Generic control
  basePath: string,
  availableTimeframes: AvailableTimeframes | undefined
) {
  const entityType = useWatch({
    control,
    name: `${basePath}.anchor.entityType` as FieldPath<T>,  // ✅ Generic path
  });
  // ...
}

// Usage in generic component
const { entityTypeOptions } = useTimeframeAnchorOptions<T>(
  control,
  basePath,
  availableTimeframes
);
```

**Rule**: If a component is generic, all hooks it uses that receive `control` or use field paths must also be generic.

#### 13. Prop Drilling for Contextual Data
**Problem**: Passing data that depends on parent context (like `availableTimeframes`) through deeply nested components.

**Solution**: Explicit prop drilling when context API is overkill:

**Data Flow**:
```
usePromotionLogic (fetch)
    ↓ return
PromotionForm (extract from hook)
    ↓ prop
PhaseForm (receive & pass)
    ↓ prop
RewardForm (receive & pass)
    ↓ prop
UsageConditionsForm (receive & pass)
    ↓ prop
TimeframeForm (consume)
```

**Implementation**:
```typescript
// 1. Domain hook fetches data
export const usePromotionLogic = (initialData?: PromotionServerModel) => {
  const { data: availableTimeframes } = useAvailableTimeframes(initialData?.id);

  return {
    // ... other returns
    availableTimeframes,  // ✅ Return for prop drilling
  };
};

// 2. Top-level form extracts from hook
const { availableTimeframes, /* ... */ } = usePromotionLogic(initialData);

// 3. Each level passes down
<PhaseForm availableTimeframes={availableTimeframes} />

// 4. Final consumer uses it
export function TimeframeForm<T>({ availableTimeframes }: Props<T>) {
  const { entityTypeOptions } = useTimeframeFormLogic<T>(
    basePath,
    availableTimeframes  // ✅ Used here
  );
}
```

**When to Use Prop Drilling**:
- ✅ Data is fetched once at top level
- ✅ Data is read-only (no mutations needed)
- ✅ Component tree is relatively shallow (3-5 levels)
- ✅ Type safety is critical

**When to Use Context Instead**:
- ❌ Data needs to be accessed by many siblings
- ❌ Tree is very deep (>5 levels)
- ❌ Data updates frequently

**Key Advantage**: Full type safety through the chain, explicit dependencies visible in props.

### Domain Architecture Patterns

#### 14. Timeframe Architecture - Semantic Distribution
**Problem**: Determining where timeframes belong in a complex entity hierarchy (Promotion → Phase → Reward → QualifyConditions/UsageConditions).

**Analysis**: In matched betting, different timeframes have different semantic meanings:
- **Promotion timeframe**: When the promotion is valid (absolute dates)
- **Qualify timeframe**: When you can qualify to earn the reward
- **Usage timeframe**: When you can use the reward after receiving it

**Bad Approaches**:
```typescript
// ❌ OPTION 1: Timeframe only on REWARD
Reward {
  timeframe: "Jan 1-31"  // Ambiguous - qualify or use?
  qualifyConditions: [...]
  usageConditions: {...}
}

// ❌ OPTION 2: Timeframe only on USAGE_CONDITIONS
Reward {
  qualifyConditions: [...]  // Can't restrict qualification period
  usageConditions: {
    timeframe: "7 days"  // Only covers usage, not qualification
  }
}

// ❌ OPTION 3: Timeframe on all three (REWARD, QualifyConditions, UsageConditions)
Reward {
  timeframe: "Jan 1-31",  // Redundant
  qualifyConditions: [
    { timeframe: "Jan 1-10" }  // Which one prevails?
  ],
  usageConditions: {
    timeframe: "7 days"
  }
}
```

**Correct Architecture**:
```typescript
// ✅ Timeframe ONLY in QualifyConditions and UsageConditions
const BaseRewardSchema = z.object({
  // ❌ NO timeframe here
  qualifyConditions: z.array(QualifyConditionSchema),  // Each has timeframe
  // ... other fields
});

const BaseQualifyConditionSchema = z.object({
  timeframe: TimeframeSchema,  // ✅ When you can qualify
  // ... condition fields
});

const FreeBetUsageConditionsSchema = z.object({
  timeframe: TimeframeSchema,  // ✅ When you can use the reward
  // ... usage fields
});
```

**Real-world examples**:

**Example 1: Automatic reward (no qualification needed)**
```typescript
{
  type: "FREEBET",
  value: 5,
  qualifyConditions: [],  // ✅ Empty = automatic on phase activation
  usageConditions: {
    type: "FREEBET",
    timeframe: {
      mode: "ABSOLUTE",
      start: "2025-01-15",
      end: "2025-01-20"
    }
  }
}
// User receives freebet automatically when phase activates
// Can use it only between Jan 15-20
```

**Example 2: Deposit-qualified reward with specific dates**
```typescript
{
  type: "FREEBET",
  value: 10,
  qualifyConditions: [
    {
      type: "DEPOSIT",
      timeframe: {
        mode: "ABSOLUTE",
        start: "2025-01-01",
        end: "2025-01-10"
      },
      conditions: { minAmount: 20 }
    }
  ],
  usageConditions: {
    type: "FREEBET",
    timeframe: {
      mode: "RELATIVE",
      anchor: { entityType: "REWARD", entityId: "self", event: "RECEIVED" },
      offsetDays: 7
    }
  }
}
// User must deposit €20 between Jan 1-10
// After receiving freebet, has 7 days to use it
```

**Example 3: Multiple qualification periods (Champions League rounds)**
```typescript
{
  type: "FREEBET",
  value: 5,
  qualifyConditions: [
    {
      type: "BET",
      timeframe: {
        mode: "ABSOLUTE",
        start: "2025-03-01",
        end: "2025-03-10"
      },  // Round 1 & 2
      conditions: { minStake: 10, sport: "FOOTBALL" }
    }
  ],
  usageConditions: {
    type: "FREEBET",
    timeframe: {
      mode: "ABSOLUTE",
      start: "2025-03-11",
      end: "2025-03-15"
    }  // Use in Round 3 only
  }
}
// Qualify by betting in rounds 1-2
// Use freebet only in round 3
```

**Inheritance Rules**:
1. If `qualifyConditions` is empty → Reward is automatic, inherits PROMOTION/PHASE timeframe implicitly
2. If `qualifyConditions` exists → Each condition specifies when it can be fulfilled
3. `usageConditions.timeframe` ALWAYS determines when the reward can be used (independent of qualification)

**Frontend Implementation**:
- `TimeframeForm` appears in:
  - ✅ `PromotionBasicInfoForm` (promotion validity period)
  - ✅ `PhaseForm` (phase activation period)
  - ✅ `QualifyConditionForm` (qualification period) - **Added Dec 2025**
  - ✅ `UsageConditionsForm` (usage period)
  - ❌ **NOT** in `RewardForm` (removed - see architecture above)

**Schema Changes (December 2025)**:
```typescript
// BEFORE (incorrect)
const BaseRewardSchema = z.object({
  timeframe: TimeframeSchema,  // ❌ Ambiguous
  qualifyConditions: z.array(QualifyConditionSchema),
});

// AFTER (correct)
const BaseRewardSchema = z.object({
  // ❌ timeframe removed - see architecture note below
  qualifyConditions: z.array(QualifyConditionSchema),  // Each has its own timeframe
});

/**
 * NOTA: El timeframe de la reward se determina por:
 * - Si tiene qualifyConditions: cada condición tiene su propio timeframe para calificar
 * - Si NO tiene qualifyConditions: hereda implícitamente el timeframe de PROMOTION/PHASE
 * - En ambos casos: usageConditions.timeframe determina el periodo de uso
 */
```

**Benefits**:
- ✅ Semantic clarity: Each timeframe has a specific, unambiguous purpose
- ✅ Flexibility: Can have different qualification and usage periods
- ✅ Supports automatic rewards: Empty qualifyConditions = automatic distribution
- ✅ No redundancy: No conflicting timeframe definitions
- ✅ Real-world accuracy: Matches actual bookmaker promotion mechanics

#### 15. Hook Architecture Patterns - Factory vs Domain Logic

**Problem**: Determining where different types of hooks should live and what responsibilities they should have, especially when forms exist in multiple contexts (nested vs standalone).

**Context**: MatBett has two form contexts for rewards:
- **Nested context**: PromotionForm → PhaseForm → RewardForm (reward within promotion)
- **Standalone context**: RewardStandaloneForm (individual reward editing)

**Solution**: Three-layer hook architecture with clear separation of concerns.

**Architecture Layers**:

**Layer 1: Factory Hooks** (`use[Entity]Form`)
- **Purpose**: Create `useForm` instances with resolver + default values
- **Location**: `apps/frontend/src/hooks/use[Entity]Form.ts`
- **Examples**: `usePromotionForm`, `useRewardForm`
- **Characteristics**:
  - Returns `UseFormReturn<T>`
  - Accepts optional `initialData?: [Entity]ServerModel`
  - Calls `buildDefault[Entity]()` from `@/utils/formDefaults`
  - Consistent pattern across all entity forms
- **Usage**: Top-level form components (pages, organisms)

**Layer 2: Domain Logic Hooks** (`use[Entity]Logic`)
- **Purpose**: Business logic specific to the entity (type changes, validations, computed values)
- **Location**: `apps/frontend/src/hooks/domain/use[Entity]Logic.ts`
- **Examples**: `usePromotionLogic`, `useRewardLogic`, `useQualifyConditionLogic`
- **Characteristics**:
  - Generic with `<T extends FieldValues>`
  - Use `useFormContext<T>()` to get form dynamically
  - Context-agnostic (works in both root and nested paths via `basePath`)
  - **NO UI state** (modals, tracking) - only business logic
  - Returns handlers, helpers, and computed values
- **Usage**: Form components (molecules, organisms)

**Layer 3: UI State Management**
- **Purpose**: UI-specific state (modal open/close, tracking selections, etc.)
- **Location**: Component state (`useState`, `useCallback`)
- **Characteristics**:
  - Managed by the component that needs it
  - Not shared via hooks
  - Component-specific orchestration
- **Exception**: `usePromotionLogic` handles everything (complex multi-entity orchestration)

**Code Example**:

```typescript
// ✅ Layer 1: Factory Hook (useRewardForm.ts)
export const useRewardForm = (initialData?: RewardServerModel): UseFormReturn<RewardFormData> => {
  return useForm<RewardFormData>({
    resolver: zodResolver(RewardSchema),
    defaultValues: buildDefaultReward(initialData?.type || "FREEBET", initialData),
    mode: "onChange",
  });
};

// ✅ Layer 2: Domain Logic Hook (useRewardLogic.ts)
export const useRewardLogic = <T extends FieldValues>(basePath: Path<T> | "") => {
  const { control, setValue, getValues } = useFormContext<T>();

  const handleTypeChange = useCallback((newType: string) => {
    // Business logic for type changes...
  }, [setValue, getValues]);

  return {
    control,
    handleTypeChange,
    hasContributingCondition,
    getPath, // Helper for building paths
  };
};

// ✅ Layer 3: UI State (in component)
export function RewardStandaloneForm({ rewardId }: Props) {
  const form = useRewardForm(rewardData); // Layer 1
  const { handleTypeChange } = useRewardLogic(""); // Layer 2

  // Layer 3: UI state
  const [qualifyConditionId, setQualifyConditionId] = useState<string>();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const handleQualifyConditionSelect = useCallback((id: string, index: number) => {
    setQualifyConditionId(id);
    setIsDepositModalOpen(true);
  }, []);

  return (
    <FormProvider {...form}>
      <RewardForm
        fieldPath=""
        onQualifyConditionSelect={handleQualifyConditionSelect}
      />
      {isDepositModalOpen && <DepositModal />}
    </FormProvider>
  );
}
```

**Helper Distribution Rules**:

When extracting helpers from complex hooks (like `usePromotionLogic`), use this decision table:

| Helper Type | Location | Example |
|-------------|----------|---------|
| Pure utility functions | `/utils/[domain]Helpers.ts` | `calculateRelativeEndDate` |
| Path builders | Domain logic hook (`getPath`) | Already exists in `useRewardLogic` |
| UI state (modals, tracking) | Component state | `isDepositModalOpen`, `qualifyConditionId` |
| UI orchestration handlers | Component callbacks | `handleQualifyConditionSelect` |
| Entity-specific business logic | Domain logic hook | `handleTypeChange`, `hasContributingCondition` |
| Multi-entity orchestration | Complex domain logic hook | `usePromotionLogic` (exception to "no UI state" rule) |

**Benefits**:
- ✅ Clear separation of concerns (factory / business logic / UI state)
- ✅ Reusability: Domain logic hooks work in any context (nested or standalone)
- ✅ Consistency: Factory pattern standardized across all entities
- ✅ No code duplication: Shared utilities in `/utils`, shared logic in domain hooks
- ✅ Type safety: Generics allow context-agnostic usage
- ✅ Maintainability: Each layer has a single, well-defined responsibility

**When to Use Each Layer**:
- **Factory hook**: Every entity that has a standalone form page
- **Domain logic hook**: Every entity with complex business rules (type changes, calculations, validations)
- **UI state in component**: Modal management, selection tracking, UI-specific orchestration
- **Exception (all-in-one)**: Use only for complex multi-entity forms (like `usePromotionLogic` managing phases + rewards + conditions)
