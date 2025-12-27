# Análisis de Campos Requeridos - Schema vs UI

## Promotion Level

### PromotionSchema (packages/shared/src/schemas/promotion.schema.ts)

| Campo | Requerido | Razón Schema |
|-------|-----------|--------------|
| `name` | ✅ SÍ | `.min(1, 'El nombre es requerido')` |
| `description` | ❌ NO | `.nullish()` |
| `bookmaker` | ❌ NO | `.nullish()` |
| `status` | ❌ NO | `.optional()` |
| `phases` | ✅ SÍ | `.array().min(1)` (al menos una phase) |
| `timeframe` | ✅ SÍ | No tiene `.optional()` ni `.nullish()` |
| `timeframe.start` | ✅ SÍ | Dentro de `AbsoluteTimeframeSchema` |
| `timeframe.end` | ✅ SÍ | Dentro de `AbsoluteTimeframeSchema` |
| `cardinality` | ✅ SÍ | No tiene `.optional()` |
| `activationMethod` | ❌ NO | `.optional()` |

---

## Phase Level

### PhaseSchema (packages/shared/src/schemas/phase.schema.ts)

| Campo | Requerido | Razón Schema |
|-------|-----------|--------------|
| `name` | ✅ SÍ | `.min(1, 'El nombre es requerido')` |
| `description` | ✅ SÍ | `.min(1, 'La descripción es requerida')` |
| `status` | ❌ NO | `.optional()` |
| `activationMethod` | ✅ SÍ | No tiene `.optional()` |
| `timeframe` | ✅ SÍ | No tiene `.optional()` |
| `rewards` | ✅ SÍ | `.array().min(1)` (al menos una reward) |

---

## Reward Level

### BaseRewardSchema (packages/shared/src/schemas/reward.schema.ts)

| Campo | Requerido | Razón Schema |
|-------|-----------|--------------|
| `type` | ✅ SÍ | Literal type (discriminated union) |
| `value` | ✅ SÍ | `.min(0)` |
| `valueType` | ✅ SÍ | No tiene `.optional()` |
| `activationMethod` | ✅ SÍ | No tiene `.optional()` |
| `claimMethod` | ✅ SÍ | No tiene `.optional()` |
| `claimRestrictions` | ❌ NO | `.nullish()` |
| `status` | ❌ NO | `.optional()` |
| `qualifyConditions` | ❌ NO | `.array().min(0)` (puede ser vacío) |
| `usageConditions` | ✅ SÍ | No tiene `.optional()` (pero es complejo) |

### UsageConditions (depende del tipo de reward)

Para FreeBet (`FreeBetUsageConditionsSchema`):
- `type`: ✅ SÍ (literal 'FREEBET')
- `timeframe`: ✅ SÍ
- `minOdds`: ❌ NO (`.optional()`)
- `maxOdds`: ❌ NO (`.optional()`)
- `allowedSports`: ❌ NO (`.optional()`)
- etc.

---

## QualifyCondition Level

### BaseQualifyConditionSchema

| Campo | Requerido | Razón Schema |
|-------|-----------|--------------|
| `type` | ✅ SÍ | Literal type (discriminated union) |
| `description` | ❌ NO | `.nullish()` |
| `timeframe` | ✅ SÍ | No tiene `.optional()` |
| `conditions` | ✅ SÍ | Objeto interno (depende del type) |

### DepositConditions (cuando contributesToRewardValue = false)

| Campo | Requerido | Razón Schema |
|-------|-----------|--------------|
| `depositCode` | ❌ NO | `.optional()` |
| `firstDepositOnly` | ❌ NO | `.optional()` |
| `targetAmount` | ✅ SÍ | `.min(0)` (campo fixed) |

### DepositConditions (cuando contributesToRewardValue = true)

| Campo | Requerido | Razón Schema |
|-------|-----------|--------------|
| `depositCode` | ❌ NO | `.optional()` |
| `firstDepositOnly` | ❌ NO | `.optional()` |
| `minAmount` | ✅ SÍ | `.min(0)` |
| `bonusPercentage` | ✅ SÍ | `.min(0).max(500)` |
| `maxBonusAmount` | ✅ SÍ | `.min(0)` |

---

## 🎯 Acción Requerida

Actualizar los siguientes componentes para añadir `required={true}` en los campos marcados con ✅:

1. **PromotionBasicInfoForm.tsx** (name, timeframe dates, cardinality)
2. **PhaseForm.tsx** (name, description, activationMethod, timeframe)
3. **RewardForm.tsx** (type, value, valueType, activationMethod, claimMethod)
4. **QualifyConditionForm.tsx** (type, timeframe)
5. **UsageConditionsForm.tsx** (timeframe y campos específicos por tipo)
6. **DepositCondition.tsx** (targetAmount o minAmount/bonusPercentage/maxBonusAmount)
7. **QualifyBetCondition.tsx** (campos según fixed vs calculated)
