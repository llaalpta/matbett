# Corrección del Cálculo de Capital de Exchange

## Problema Identificado

El cálculo anterior del capital necesario en exchange era completamente irreal. Se estaba calculando con ratios de riesgo del 6-15% cuando la realidad del matched betting muestra ratios del 58-158% según la cuota mínima.

## Ejemplo del Error

**Caso**: Bono 200€, rollover x10 (2000€), cuota mínima 2.5

- **Cálculo anterior**: ~200€ en exchange (10% de 2000€)
- **Cálculo corregido**: ~3160€ en exchange (158% de 2000€)
- **Realidad del usuario**: "alrededor de 3100-3200€ en el exchange" ✅

## Cálculos Corregidos

### Función `calculateExchangeRiskPerEuro`

Basado en ratings del 92.5% (pérdida 7.5%) con cuotas reales del mercado:

```typescript
// Cuotas muy bajas: 1.5 vs 1.61 → ~0.58€ riesgo por €1 apostado
if (minOdds <= 1.5) return 0.58;

// Cuotas bajas: 1.6 vs 1.715 → ~0.67€ riesgo por €1 apostado
if (minOdds <= 1.6) return 0.67;

// Cuotas medias-bajas: 2.0 vs 2.14 → ~1.08€ riesgo por €1 apostado
if (minOdds <= 2.0) return 1.08;

// Cuotas medias: 2.5 vs 2.67 → ~1.58€ riesgo por €1 apostado
if (minOdds <= 2.5) return 1.58;

// Cuotas altas y muy altas: hasta 2.5€ por €1
```

### Explicación Matemática

Para una apuesta de 100€ a cuota 2.5 vs 2.67:

- **Stake contra**: 754.72€
- **Riesgo**: 1260.38€
- **Ratio**: 1.575€ de riesgo por cada €1 apostado a favor

## Ejemplos Verificados

### Bono Pequeño

- **Bono**: 50€, rollover x5 = 250€, cuota 2.0
- **Exchange**: 250€ × 1.08 = 270€
- **Total**: 50€ (casa) + 270€ (exchange) = 320€

### Bono Grande

- **Bono**: 200€, rollover x10 = 2000€, cuota 2.5
- **Exchange**: 2000€ × 1.58 = 3160€
- **Total**: 200€ (casa) + 3160€ (exchange) = 3360€

## Impacto en la UI

Ahora se muestra:

- **Capital real** necesario en exchange
- **Ratio de riesgo** por euro apostado
- **Advertencias precisas** sobre liquidez necesaria

## Cambios Realizados

1. ✅ **Hook**: Corregida función `calculateExchangeRiskPerEuro`
2. ✅ **Hook**: Eliminado multiplicador de seguridad innecesario (1.2x)
3. ✅ **UI**: Agregada información del ratio de riesgo
4. ✅ **Documentación**: Ejemplos matemáticos reales

Los cálculos ahora reflejan la realidad del matched betting y ayudarán a los usuarios a planificar correctamente su liquidez.
