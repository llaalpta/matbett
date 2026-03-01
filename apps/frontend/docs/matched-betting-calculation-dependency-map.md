# Matched Betting - Analisis funcion a funcion (dependencias, triggers y secuencia)

Analisis tecnico de las **41 funciones** actuales de `apps/frontend/src/utils/calculate.ts` para:
- mapear configuracion de formulario -> funcion concreta,
- identificar triggers que deben disparar recalculo,
- documentar orden secuencial de calculo de cada escenario.

## Convenciones de nombres normalizados
- `mainForm` -> `mainLeg`
- `combinedMainForm` -> `combinedMainLeg`
- `main2Form` -> `prepaymentLeg`
- `hedge1Form` -> `hedgeLeg1`
- `hedge2Form` -> `hedgeLeg2`
- `hedge3Form` -> `hedgeLeg3`
- `freeBet` -> `rewardProjection`
- `comission` -> `commission`

## Estado actual
- Funciones analizadas: **41**
- Cobertura reward en formulas actuales: principalmente `FREEBET` para `USE_REWARD` y `GENERATE_REWARD`.
- Este documento describe comportamiento actual (no valida precision matematica ni corrige formulas).

## Indice
- [1. `calculate_combined_2_lines_dutching_standard_generate_freebet`](#1-calculate-combined-2-lines-dutching-standard-generate-freebet)
- [2. `calculate_combined_2_lines_dutching_standard_no_promotion`](#2-calculate-combined-2-lines-dutching-standard-no-promotion)
- [3. `calculate_combined_2_lines_dutching_standard_use_freebet`](#3-calculate-combined-2-lines-dutching-standard-use-freebet)
- [4. `calculate_combined_2_lines_matched_betting_standard_generate_freebet`](#4-calculate-combined-2-lines-matched-betting-standard-generate-freebet)
- [5. `calculate_combined_2_lines_matched_betting_standard_no_promotion`](#5-calculate-combined-2-lines-matched-betting-standard-no-promotion)
- [6. `calculate_combined_2_lines_matched_betting_standard_use_freebet`](#6-calculate-combined-2-lines-matched-betting-standard-use-freebet)
- [7. `calculate_combined_3_lines_dutching_standard_generate_freebet`](#7-calculate-combined-3-lines-dutching-standard-generate-freebet)
- [8. `calculate_combined_3_lines_dutching_standard_no_promotion`](#8-calculate-combined-3-lines-dutching-standard-no-promotion)
- [9. `calculate_combined_3_lines_dutching_standard_use_freebet`](#9-calculate-combined-3-lines-dutching-standard-use-freebet)
- [10. `calculate_combined_3_lines_matched_betting_standard_generate_freebet`](#10-calculate-combined-3-lines-matched-betting-standard-generate-freebet)
- [11. `calculate_combined_3_lines_matched_betting_standard_no_promotion`](#11-calculate-combined-3-lines-matched-betting-standard-no-promotion)
- [12. `calculate_combined_3_lines_matched_betting_standard_use_freebet`](#12-calculate-combined-3-lines-matched-betting-standard-use-freebet)
- [13. `calculate_simple_dutching_2_options_overlay_no_promotion`](#13-calculate-simple-dutching-2-options-overlay-no-promotion)
- [14. `calculate_simple_dutching_2_options_overlay_prepayment`](#14-calculate-simple-dutching-2-options-overlay-prepayment)
- [15. `calculate_simple_dutching_2_options_overlay_use_freebet`](#15-calculate-simple-dutching-2-options-overlay-use-freebet)
- [16. `calculate_simple_dutching_2_options_standard_generate_freebet`](#16-calculate-simple-dutching-2-options-standard-generate-freebet)
- [17. `calculate_simple_dutching_2_options_standard_no_promotion`](#17-calculate-simple-dutching-2-options-standard-no-promotion)
- [18. `calculate_simple_dutching_2_options_standard_prepayment`](#18-calculate-simple-dutching-2-options-standard-prepayment)
- [19. `calculate_simple_dutching_2_options_standard_use_freebet`](#19-calculate-simple-dutching-2-options-standard-use-freebet)
- [20. `calculate_simple_dutching_2_options_underlay_no_promotion`](#20-calculate-simple-dutching-2-options-underlay-no-promotion)
- [21. `calculate_simple_dutching_2_options_underlay_prepayment`](#21-calculate-simple-dutching-2-options-underlay-prepayment)
- [22. `calculate_simple_dutching_2_options_underlay_use_freebet`](#22-calculate-simple-dutching-2-options-underlay-use-freebet)
- [23. `calculate_simple_dutching_3_options_standard_generate_freebet`](#23-calculate-simple-dutching-3-options-standard-generate-freebet)
- [24. `calculate_simple_dutching_3_options_standard_no_promotion`](#24-calculate-simple-dutching-3-options-standard-no-promotion)
- [25. `calculate_simple_dutching_3_options_standard_use_freebet`](#25-calculate-simple-dutching-3-options-standard-use-freebet)
- [26. `calculate_simple_dutching_3_options_underlay_no_promotion`](#26-calculate-simple-dutching-3-options-underlay-no-promotion)
- [27. `calculate_simple_matched_betting_overlay_generate_freebet`](#27-calculate-simple-matched-betting-overlay-generate-freebet)
- [28. `calculate_simple_matched_betting_overlay_no_promotion`](#28-calculate-simple-matched-betting-overlay-no-promotion)
- [29. `calculate_simple_matched_betting_overlay_prepayment`](#29-calculate-simple-matched-betting-overlay-prepayment)
- [30. `calculate_simple_matched_betting_overlay_use_freebet`](#30-calculate-simple-matched-betting-overlay-use-freebet)
- [31. `calculate_simple_matched_betting_standard_generate_freebet`](#31-calculate-simple-matched-betting-standard-generate-freebet)
- [32. `calculate_simple_matched_betting_standard_generate_freebet_unmatched`](#32-calculate-simple-matched-betting-standard-generate-freebet-unmatched)
- [33. `calculate_simple_matched_betting_standard_no_promotion`](#33-calculate-simple-matched-betting-standard-no-promotion)
- [34. `calculate_simple_matched_betting_standard_no_promotion_unmatched`](#34-calculate-simple-matched-betting-standard-no-promotion-unmatched)
- [35. `calculate_simple_matched_betting_standard_prepayment`](#35-calculate-simple-matched-betting-standard-prepayment)
- [36. `calculate_simple_matched_betting_standard_use_freebet`](#36-calculate-simple-matched-betting-standard-use-freebet)
- [37. `calculate_simple_matched_betting_standard_use_freebet_unmatched`](#37-calculate-simple-matched-betting-standard-use-freebet-unmatched)
- [38. `calculate_simple_matched_betting_underlay_generate_freebet`](#38-calculate-simple-matched-betting-underlay-generate-freebet)
- [39. `calculate_simple_matched_betting_underlay_no_promotion`](#39-calculate-simple-matched-betting-underlay-no-promotion)
- [40. `calculate_simple_matched_betting_underlay_prepayment`](#40-calculate-simple-matched-betting-underlay-prepayment)
- [41. `calculate_simple_matched_betting_underlay_use_freebet`](#41-calculate-simple-matched-betting-underlay-use-freebet)

## 1. `calculate_combined_2_lines_dutching_standard_generate_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:794`
- Configuracion: strategy=DUTCHING | lineMode=COMBINED_2 | dutchingOptions=- | mode=STANDARD | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_COMBINED_2_GENERATE
- Parametros: `line1Status`, `line2Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.refundRatio`
- `combinedMainLeg.refundValue`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `line1Status`
- `line2Status`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `rewardProjection.profitRetained` <- `combinedMainLeg.refundRatio`, `combinedMainLeg.refundValue`
4. `combinedMainLeg.risk` <- `combinedMainLeg.stake`
5. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
6. `hedgeLeg2.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `rewardProjection.profitRetained`, `hedgeLeg2.odds`
7. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
8. `hedgeLeg2.profit` <- `hedgeLeg2.stake`, `hedgeLeg2.odds`
9. `hedgeLeg1.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `rewardProjection.profitRetained`, `hedgeLeg2.stake`, `hedgeLeg1.odds`
10. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
11. `hedgeLeg1.profit` <- `hedgeLeg1.stake`, `hedgeLeg1.odds`
12. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
13. `rewardProjection.hedge1FormfinalBalance` <- `hedgeLeg1.winBalance`, `rewardProjection.profitRetained`
14. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
15. `rewardProjection.hedge2FormfinalBalance` <- `hedgeLeg2.winBalance`, `rewardProjection.profitRetained`
16. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 2. `calculate_combined_2_lines_dutching_standard_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:727`
- Configuracion: strategy=DUTCHING | lineMode=COMBINED_2 | dutchingOptions=- | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_COMBINED_2_BASE
- Parametros: `line1Status`, `line2Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `line1Status`
- `line2Status`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `combinedMainLeg.risk` <- `combinedMainLeg.stake`
4. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
5. `hedgeLeg1.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `hedgeLeg1.odds`, `hedgeLeg2.odds`
6. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
7. `hedgeLeg1.profit` <- `hedgeLeg1.stake`, `hedgeLeg1.odds`
8. `hedgeLeg2.stake` <- `hedgeLeg1.stake`, `hedgeLeg1.odds`, `hedgeLeg2.odds`
9. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
10. `hedgeLeg2.profit` <- `hedgeLeg2.stake`, `hedgeLeg2.odds`
11. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
12. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
13. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 3. `calculate_combined_2_lines_dutching_standard_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:761`
- Configuracion: strategy=DUTCHING | lineMode=COMBINED_2 | dutchingOptions=- | mode=STANDARD | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_COMBINED_2_BASE
- Parametros: `line1Status`, `line2Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `line1Status`
- `line2Status`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `combinedMainLeg.risk` <- `(constante)`
4. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
5. `hedgeLeg2.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg2.odds`
6. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
7. `hedgeLeg2.profit` <- `hedgeLeg2.stake`, `hedgeLeg2.odds`
8. `hedgeLeg1.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg2.stake`, `hedgeLeg1.odds`
9. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
10. `hedgeLeg1.profit` <- `hedgeLeg1.stake`, `hedgeLeg1.odds`
11. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
12. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
13. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 4. `calculate_combined_2_lines_matched_betting_standard_generate_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:900`
- Configuracion: strategy=MATCHED_BETTING | lineMode=COMBINED_2 | dutchingOptions=- | mode=STANDARD | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_COMBINED_2_GENERATE
- Parametros: `line1Status`, `line2Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.refundRatio`
- `combinedMainLeg.refundValue`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `line1Status`
- `line2Status`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `rewardProjection.profitRetained` <- `combinedMainLeg.refundRatio`, `combinedMainLeg.refundValue`
4. `combinedMainLeg.risk` <- `combinedMainLeg.stake`
5. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
6. `hedgeLeg2.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `rewardProjection.profitRetained`, `hedgeLeg2.odds`
7. `hedgeLeg2.risk` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
8. `hedgeLeg2.profit` <- `hedgeLeg2.stake`
9. `hedgeLeg1.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `hedgeLeg2.odds`, `hedgeLeg2.stake`, `rewardProjection.profitRetained`, `hedgeLeg1.odds`
10. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
11. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
12. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
13. `rewardProjection.hedge1FormfinalBalance` <- `hedgeLeg1.winBalance`, `rewardProjection.profitRetained`
14. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
15. `rewardProjection.hedge2FormfinalBalance` <- `hedgeLeg2.winBalance`, `rewardProjection.profitRetained`
16. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 5. `calculate_combined_2_lines_matched_betting_standard_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:833`
- Configuracion: strategy=MATCHED_BETTING | lineMode=COMBINED_2 | dutchingOptions=- | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_COMBINED_2_BASE
- Parametros: `line1Status`, `line2Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `line1Status`
- `line2Status`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `combinedMainLeg.risk` <- `combinedMainLeg.stake`
4. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
5. `hedgeLeg2.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `hedgeLeg2.odds`
6. `hedgeLeg2.risk` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
7. `hedgeLeg2.profit` <- `hedgeLeg2.stake`
8. `hedgeLeg1.stake` <- `hedgeLeg2.stake`, `hedgeLeg1.odds`
9. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
10. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
11. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
12. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
13. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 6. `calculate_combined_2_lines_matched_betting_standard_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:867`
- Configuracion: strategy=MATCHED_BETTING | lineMode=COMBINED_2 | dutchingOptions=- | mode=STANDARD | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_COMBINED_2_BASE
- Parametros: `line1Status`, `line2Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `line1Status`
- `line2Status`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `combinedMainLeg.risk` <- `(constante)`
4. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
5. `hedgeLeg2.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg2.odds`
6. `hedgeLeg2.risk` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
7. `hedgeLeg2.profit` <- `hedgeLeg2.stake`
8. `hedgeLeg1.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg2.odds`, `hedgeLeg2.stake`, `hedgeLeg1.odds`
9. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
10. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
11. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
12. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
13. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 7. `calculate_combined_3_lines_dutching_standard_generate_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:1214`
- Configuracion: strategy=DUTCHING | lineMode=COMBINED_3 | dutchingOptions=- | mode=STANDARD | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_COMBINED_3_GENERATE
- Parametros: `line1Status`, `line2Status`, `line3Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.refundRatio`
- `combinedMainLeg.refundValue`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `hedgeLeg3.odds`
- `hedgeLeg3.stake`
- `line1Status`
- `line2Status`
- `line3Status`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `line3.status` <- `line3Status`
4. `rewardProjection.profitRetained` <- `combinedMainLeg.refundRatio`, `combinedMainLeg.refundValue`
5. `combinedMainLeg.risk` <- `combinedMainLeg.stake`
6. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
7. `hedgeLeg3.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `rewardProjection.profitRetained`, `hedgeLeg3.odds`
8. `hedgeLeg3.risk` <- `hedgeLeg3.stake`
9. `hedgeLeg3.profit` <- `hedgeLeg3.stake`, `hedgeLeg3.odds`
10. `hedgeLeg2.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `rewardProjection.profitRetained`, `hedgeLeg3.stake`, `hedgeLeg2.odds`
11. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
12. `hedgeLeg2.profit` <- `hedgeLeg2.stake`, `hedgeLeg2.odds`
13. `hedgeLeg1.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `rewardProjection.profitRetained`, `hedgeLeg3.stake`, `hedgeLeg2.stake`, `hedgeLeg1.odds`
14. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
15. `hedgeLeg1.profit` <- `hedgeLeg1.stake`, `hedgeLeg1.odds`
16. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
17. `rewardProjection.hedge1FormfinalBalance` <- `hedgeLeg1.winBalance`, `rewardProjection.profitRetained`
18. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
19. `rewardProjection.hedge2FormfinalBalance` <- `hedgeLeg2.winBalance`, `rewardProjection.profitRetained`
20. `hedgeLeg3.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.profit`
21. `rewardProjection.hedge3FormfinalBalance` <- `hedgeLeg3.winBalance`, `rewardProjection.profitRetained`
22. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 8. `calculate_combined_3_lines_dutching_standard_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:1106`
- Configuracion: strategy=DUTCHING | lineMode=COMBINED_3 | dutchingOptions=- | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_COMBINED_3_BASE
- Parametros: `line1Status`, `line2Status`, `line3Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `hedgeLeg3.odds`
- `hedgeLeg3.stake`
- `line1Status`
- `line2Status`
- `line3Status`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `line3.status` <- `line3Status`
4. `combinedMainLeg.risk` <- `combinedMainLeg.stake`
5. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
6. `hedgeLeg1.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `hedgeLeg3.odds`, `hedgeLeg1.odds`, `hedgeLeg2.odds`
7. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
8. `hedgeLeg1.profit` <- `hedgeLeg1.stake`, `hedgeLeg1.odds`
9. `hedgeLeg2.stake` <- `hedgeLeg1.stake`, `hedgeLeg1.odds`, `hedgeLeg2.odds`
10. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
11. `hedgeLeg2.profit` <- `hedgeLeg2.stake`, `hedgeLeg2.odds`
12. `hedgeLeg3.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `hedgeLeg3.odds`
13. `hedgeLeg3.risk` <- `hedgeLeg3.stake`
14. `hedgeLeg3.profit` <- `hedgeLeg3.stake`, `hedgeLeg3.odds`
15. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
16. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
17. `hedgeLeg3.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.profit`
18. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 9. `calculate_combined_3_lines_dutching_standard_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:1161`
- Configuracion: strategy=DUTCHING | lineMode=COMBINED_3 | dutchingOptions=- | mode=STANDARD | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_COMBINED_3_BASE
- Parametros: `line1Status`, `line2Status`, `line3Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `hedgeLeg3.odds`
- `hedgeLeg3.stake`
- `line1Status`
- `line2Status`
- `line3Status`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `line3.status` <- `line3Status`
4. `combinedMainLeg.risk` <- `(constante)`
5. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
6. `hedgeLeg3.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg3.odds`
7. `hedgeLeg3.risk` <- `hedgeLeg3.stake`
8. `hedgeLeg3.profit` <- `hedgeLeg3.stake`, `hedgeLeg3.odds`
9. `hedgeLeg2.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg3.stake`, `hedgeLeg2.odds`
10. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
11. `hedgeLeg2.profit` <- `hedgeLeg2.stake`, `hedgeLeg2.odds`
12. `hedgeLeg1.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg3.stake`, `hedgeLeg2.stake`, `hedgeLeg1.odds`
13. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
14. `hedgeLeg1.profit` <- `hedgeLeg1.stake`, `hedgeLeg1.odds`
15. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
16. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
17. `hedgeLeg3.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.profit`
18. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 10. `calculate_combined_3_lines_matched_betting_standard_generate_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:1046`
- Configuracion: strategy=MATCHED_BETTING | lineMode=COMBINED_3 | dutchingOptions=- | mode=STANDARD | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_COMBINED_3_GENERATE
- Parametros: `line1Status`, `line2Status`, `line3Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.refundRatio`
- `combinedMainLeg.refundValue`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `hedgeLeg3.odds`
- `hedgeLeg3.stake`
- `line1Status`
- `line2Status`
- `line3Status`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `line3.status` <- `line3Status`
4. `rewardProjection.profitRetained` <- `combinedMainLeg.refundRatio`, `combinedMainLeg.refundValue`
5. `combinedMainLeg.risk` <- `combinedMainLeg.stake`
6. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
7. `hedgeLeg3.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `rewardProjection.profitRetained`, `hedgeLeg3.odds`
8. `hedgeLeg3.risk` <- `hedgeLeg3.odds`, `hedgeLeg3.stake`
9. `hedgeLeg3.profit` <- `hedgeLeg3.stake`
10. `hedgeLeg2.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `hedgeLeg3.odds`, `hedgeLeg3.stake`, `rewardProjection.profitRetained`, `hedgeLeg2.odds`
11. `hedgeLeg2.risk` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
12. `hedgeLeg2.profit` <- `hedgeLeg2.stake`
13. `hedgeLeg1.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `hedgeLeg2.odds`, `hedgeLeg2.stake`, `hedgeLeg3.odds`, `hedgeLeg3.stake`, `rewardProjection.profitRetained`, `hedgeLeg1.odds`
14. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
15. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
16. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
17. `rewardProjection.hedge1FormfinalBalance` <- `hedgeLeg1.winBalance`, `rewardProjection.profitRetained`
18. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
19. `rewardProjection.hedge2FormfinalBalance` <- `hedgeLeg2.winBalance`, `rewardProjection.profitRetained`
20. `hedgeLeg3.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.profit`
21. `rewardProjection.hedge3FormfinalBalance` <- `hedgeLeg3.winBalance`, `rewardProjection.profitRetained`
22. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 11. `calculate_combined_3_lines_matched_betting_standard_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:941`
- Configuracion: strategy=MATCHED_BETTING | lineMode=COMBINED_3 | dutchingOptions=- | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_COMBINED_3_BASE
- Parametros: `line1Status`, `line2Status`, `line3Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `hedgeLeg3.odds`
- `hedgeLeg3.stake`
- `line1Status`
- `line2Status`
- `line3Status`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `line3.status` <- `line3Status`
4. `combinedMainLeg.risk` <- `combinedMainLeg.stake`
5. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
6. `hedgeLeg3.stake` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`, `hedgeLeg3.odds`
7. `hedgeLeg3.risk` <- `hedgeLeg3.odds`, `hedgeLeg3.stake`
8. `hedgeLeg3.profit` <- `hedgeLeg3.stake`
9. `hedgeLeg2.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg3.odds`, `hedgeLeg3.stake`, `hedgeLeg2.odds`
10. `hedgeLeg2.risk` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
11. `hedgeLeg2.profit` <- `hedgeLeg2.stake`
12. `hedgeLeg1.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg3.odds`, `hedgeLeg3.stake`, `hedgeLeg2.odds`, `hedgeLeg2.stake`, `hedgeLeg1.odds`
13. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
14. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
15. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
16. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
17. `hedgeLeg3.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.profit`
18. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 12. `calculate_combined_3_lines_matched_betting_standard_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:993`
- Configuracion: strategy=MATCHED_BETTING | lineMode=COMBINED_3 | dutchingOptions=- | mode=STANDARD | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_COMBINED_3_BASE
- Parametros: `line1Status`, `line2Status`, `line3Status`

**Triggers de recalculo**
- `combinedMainLeg.odds`
- `combinedMainLeg.stake`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `hedgeLeg3.odds`
- `hedgeLeg3.stake`
- `line1Status`
- `line2Status`
- `line3Status`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `line1.status` <- `line1Status`
2. `line2.status` <- `line2Status`
3. `line3.status` <- `line3Status`
4. `combinedMainLeg.risk` <- `(constante)`
5. `combinedMainLeg.profit` <- `combinedMainLeg.stake`, `combinedMainLeg.odds`
6. `hedgeLeg3.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg3.odds`
7. `hedgeLeg3.risk` <- `hedgeLeg3.odds`, `hedgeLeg3.stake`
8. `hedgeLeg3.profit` <- `hedgeLeg3.stake`
9. `hedgeLeg2.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg3.odds`, `hedgeLeg3.stake`, `hedgeLeg2.odds`
10. `hedgeLeg2.risk` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
11. `hedgeLeg2.profit` <- `hedgeLeg2.stake`
12. `hedgeLeg1.stake` <- `combinedMainLeg.odds`, `combinedMainLeg.stake`, `hedgeLeg3.odds`, `hedgeLeg3.stake`, `hedgeLeg2.odds`, `hedgeLeg2.stake`, `hedgeLeg1.odds`
13. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
14. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
15. `hedgeLeg1.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.profit`
16. `hedgeLeg2.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
17. `hedgeLeg3.winBalance` <- `combinedMainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.profit`
18. `combinedMainLeg.winBalance` <- `combinedMainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`, `hedgeLeg3.risk`

- Notas de rama: `winBalance` final depende de estados de linea.

## 13. `calculate_simple_dutching_2_options_overlay_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:570`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=OVERLAY | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.stake`, `hedgeLeg1.odds`
4. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
6. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 14. `calculate_simple_dutching_2_options_overlay_prepayment`
- Fuente: `apps/frontend/src/utils/calculate.ts:583`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=OVERLAY | promoAction=NONE | rewardType=- | hedgeAdjustment=PREPAYMENT | profile=PF_SINGLE_PREPAYMENT
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `prepaymentLeg.commission`
- `prepaymentLeg.odds`
- `prepaymentLeg.stake`
- `prepaymentTriggered`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `(constante)`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.stake`, `hedgeLeg1.odds`, `hedgeLeg1.commission`
4. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `prepaymentLeg.stake` <- `hedgeLeg1.profit`, `hedgeLeg1.risk`, `prepaymentLeg.odds`, `prepaymentLeg.commission`
6. `prepaymentLeg.risk` <- `prepaymentLeg.stake`
7. `prepaymentLeg.profit` <- `prepaymentLeg.odds`, `prepaymentLeg.stake`, `prepaymentLeg.commission`
8. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`
9. `hedgeLeg1.winBalance` <- `mainLeg.profit`, `hedgeLeg1.profit`, `prepaymentLeg.risk`
10. `prepaymentLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`

- Notas de rama: escenario `PREPAYMENT` introduce `prepaymentLeg` tras preliquidacion.

## 15. `calculate_simple_dutching_2_options_overlay_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:556`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=OVERLAY | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `(constante)`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.stake`, `hedgeLeg1.odds`, `hedgeLeg1.commission`
4. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
6. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 16. `calculate_simple_dutching_2_options_standard_generate_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:452`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=STANDARD | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE_GENERATE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.refundRatio`
- `mainLeg.refundValue`
- `mainLeg.stake`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `rewardProjection.profitRetained` <- `mainLeg.refundRatio`, `mainLeg.refundValue`
4. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `mainLeg.refundRatio`, `mainLeg.refundValue`, `hedgeLeg1.odds`
5. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
6. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
7. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
8. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`
9. `rewardProjection.profitRetained` <- `mainLeg.refundRatio`, `mainLeg.refundValue`
10. `rewardProjection.hedge1FormfinalBalance` <- `hedgeLeg1.winBalance`, `rewardProjection.profitRetained`

- Notas de rama: sin bifurcacion por estados de linea.

## 17. `calculate_simple_dutching_2_options_standard_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:421`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`
4. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
6. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
7. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 18. `calculate_simple_dutching_2_options_standard_prepayment`
- Fuente: `apps/frontend/src/utils/calculate.ts:476`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=PREPAYMENT | profile=PF_SINGLE_PREPAYMENT
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `prepaymentLeg.commission`
- `prepaymentLeg.odds`
- `prepaymentLeg.stake`
- `prepaymentTriggered`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`
4. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
6. `prepaymentLeg.stake` <- `hedgeLeg1.profit`, `hedgeLeg1.risk`, `prepaymentLeg.odds`, `prepaymentLeg.commission`
7. `prepaymentLeg.risk` <- `prepaymentLeg.stake`
8. `prepaymentLeg.profit` <- `prepaymentLeg.odds`, `prepaymentLeg.stake`, `prepaymentLeg.commission`
9. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`
10. `hedgeLeg1.winBalance` <- `mainLeg.profit`, `hedgeLeg1.profit`, `prepaymentLeg.risk`
11. `prepaymentLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`

- Notas de rama: escenario `PREPAYMENT` introduce `prepaymentLeg` tras preliquidacion.

## 19. `calculate_simple_dutching_2_options_standard_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:438`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=STANDARD | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `(constante)`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.profit`, `hedgeLeg1.odds`
4. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
6. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 20. `calculate_simple_dutching_2_options_underlay_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:503`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=UNDERLAY | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.profit`
4. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
6. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
7. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 21. `calculate_simple_dutching_2_options_underlay_prepayment`
- Fuente: `apps/frontend/src/utils/calculate.ts:531`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=UNDERLAY | promoAction=NONE | rewardType=- | hedgeAdjustment=PREPAYMENT | profile=PF_SINGLE_PREPAYMENT
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `prepaymentLeg.commission`
- `prepaymentLeg.odds`
- `prepaymentLeg.stake`
- `prepaymentTriggered`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.profit`
4. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
6. `prepaymentLeg.stake` <- `hedgeLeg1.profit`, `hedgeLeg1.risk`, `prepaymentLeg.odds`, `prepaymentLeg.commission`
7. `prepaymentLeg.risk` <- `prepaymentLeg.stake`
8. `prepaymentLeg.profit` <- `prepaymentLeg.odds`, `prepaymentLeg.stake`, `prepaymentLeg.commission`
9. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`
10. `hedgeLeg1.winBalance` <- `mainLeg.profit`, `hedgeLeg1.profit`, `prepaymentLeg.risk`
11. `prepaymentLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`

- Notas de rama: escenario `PREPAYMENT` introduce `prepaymentLeg` tras preliquidacion.

## 22. `calculate_simple_dutching_2_options_underlay_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:518`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=2 | mode=UNDERLAY | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `(constante)`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.stake`, `mainLeg.odds`
4. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
6. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 23. `calculate_simple_dutching_3_options_standard_generate_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:661`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=3 | mode=STANDARD | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_DUTCH_3_GENERATE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.commission`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `mainLeg.odds`
- `mainLeg.refundRatio`
- `mainLeg.refundValue`
- `mainLeg.stake`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `rewardProjection.profitRetained` <- `mainLeg.refundRatio`, `mainLeg.refundValue`
2. `mainLeg.risk` <- `mainLeg.stake`
3. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
4. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `rewardProjection.profitRetained`, `hedgeLeg1.commission`, `hedgeLeg1.odds`
5. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
6. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
7. `hedgeLeg2.stake` <- `mainLeg.odds`, `mainLeg.stake`, `rewardProjection.profitRetained`, `hedgeLeg2.commission`, `hedgeLeg2.odds`
8. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
9. `hedgeLeg2.profit` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
10. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`
11. `hedgeLeg1.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.risk`
12. `hedgeLeg2.winBalance` <- `mainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`
13. `rewardProjection.hedge1FormfinalBalance` <- `hedgeLeg1.winBalance`, `rewardProjection.profitRetained`
14. `rewardProjection.hedge2FormfinalBalance` <- `hedgeLeg2.winBalance`, `rewardProjection.profitRetained`

- Notas de rama: sin bifurcacion por estados de linea.

## 24. `calculate_simple_dutching_3_options_standard_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:607`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=3 | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_SINGLE_DUTCH_3_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `mainLeg.odds`
- `mainLeg.stake`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`
4. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
6. `hedgeLeg2.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg2.odds`
7. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
8. `hedgeLeg2.profit` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
9. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`
10. `hedgeLeg1.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.risk`
11. `hedgeLeg2.winBalance` <- `mainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`

- Notas de rama: sin bifurcacion por estados de linea.

## 25. `calculate_simple_dutching_3_options_standard_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:631`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=3 | mode=STANDARD | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_DUTCH_3_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `(constante)`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`
4. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
6. `hedgeLeg2.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg2.odds`
7. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
8. `hedgeLeg2.profit` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
9. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`
10. `hedgeLeg1.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.risk`
11. `hedgeLeg2.winBalance` <- `mainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`

- Notas de rama: sin bifurcacion por estados de linea.

## 26. `calculate_simple_dutching_3_options_underlay_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:697`
- Configuracion: strategy=DUTCHING | lineMode=SINGLE | dutchingOptions=3 | mode=UNDERLAY | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_SINGLE_DUTCH_3_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.commission`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `mainLeg.odds`
- `mainLeg.stake`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg2.stake` <- `mainLeg.stake`, `mainLeg.odds`, `hedgeLeg2.odds`, `hedgeLeg2.commission`, `hedgeLeg1.odds`, `hedgeLeg1.commission`
4. `hedgeLeg2.risk` <- `hedgeLeg2.stake`
5. `hedgeLeg2.profit` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
6. `hedgeLeg1.stake` <- `hedgeLeg2.stake`, `hedgeLeg2.odds`, `hedgeLeg2.commission`, `hedgeLeg1.odds`, `hedgeLeg1.commission`
7. `hedgeLeg1.risk` <- `hedgeLeg1.stake`
8. `hedgeLeg1.profit` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
9. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`
10. `hedgeLeg1.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.risk`
11. `hedgeLeg2.winBalance` <- `mainLeg.risk`, `hedgeLeg1.risk`, `hedgeLeg2.profit`

- Notas de rama: sin bifurcacion por estados de linea.

## 27. `calculate_simple_matched_betting_overlay_generate_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:377`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=OVERLAY | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE_GENERATE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.refundRatio`
- `mainLeg.refundValue`
- `mainLeg.stake`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `rewardProjection.profitRetained` <- `mainLeg.refundRatio`, `mainLeg.refundValue`
2. `mainLeg.risk` <- `mainLeg.stake`
3. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
4. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`
5. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
6. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
7. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
8. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`
9. `rewardProjection.hedge1FormfinalBalance` <- `hedgeLeg1.winBalance`, `rewardProjection.profitRetained`

- Notas de rama: sin bifurcacion por estados de linea.

## 28. `calculate_simple_matched_betting_overlay_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:348`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=OVERLAY | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `hedgeLeg1.odds`, `mainLeg.stake`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
6. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
7. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 29. `calculate_simple_matched_betting_overlay_prepayment`
- Fuente: `apps/frontend/src/utils/calculate.ts:395`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=OVERLAY | promoAction=NONE | rewardType=- | hedgeAdjustment=PREPAYMENT | profile=PF_SINGLE_PREPAYMENT
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `prepaymentLeg.commission`
- `prepaymentLeg.odds`
- `prepaymentLeg.stake`
- `prepaymentTriggered`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `hedgeLeg1.odds`, `mainLeg.stake`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
6. `prepaymentLeg.stake` <- `hedgeLeg1.profit`, `hedgeLeg1.risk`, `prepaymentLeg.odds`, `prepaymentLeg.commission`
7. `prepaymentLeg.risk` <- `prepaymentLeg.stake`
8. `prepaymentLeg.profit` <- `prepaymentLeg.odds`, `prepaymentLeg.stake`, `prepaymentLeg.commission`
9. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`
10. `hedgeLeg1.winBalance` <- `mainLeg.profit`, `hedgeLeg1.profit`, `prepaymentLeg.risk`
11. `prepaymentLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`

- Notas de rama: escenario `PREPAYMENT` introduce `prepaymentLeg` tras preliquidacion.

## 30. `calculate_simple_matched_betting_overlay_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:363`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=OVERLAY | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `(constante)`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
6. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
7. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 31. `calculate_simple_matched_betting_standard_generate_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:232`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=STANDARD | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE_GENERATE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.refundRatio`
- `mainLeg.refundValue`
- `mainLeg.stake`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `rewardProjection.profitRetained` <- `mainLeg.refundRatio`, `mainLeg.refundValue`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `mainLeg.risk` <- `mainLeg.stake`
4. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `mainLeg.refundRatio`, `mainLeg.refundValue`, `hedgeLeg1.odds`, `hedgeLeg1.commission`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
6. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
7. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
8. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`
9. `rewardProjection.hedge1FormfinalBalance` <- `hedgeLeg1.winBalance`, `rewardProjection.profitRetained`

- Notas de rama: sin bifurcacion por estados de linea.

## 32. `calculate_simple_matched_betting_standard_generate_freebet_unmatched`
- Fuente: `apps/frontend/src/utils/calculate.ts:171`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=STANDARD | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=UNMATCHED | profile=PF_SINGLE_UNMATCHED
- Parametros: `matchedStake`, `cancelledStake`, `newOdds`

**Triggers de recalculo**
- `cancelledStake`
- `combinedMainLeg.refundRatio`
- `combinedMainLeg.refundValue`
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.commission`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `matchedStake`
- `newOdds`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `rewardProjection.profitRetained` <- `combinedMainLeg.refundRatio`, `combinedMainLeg.refundValue`
2. `hedgeLeg1.cancelledStake` <- `cancelledStake`
3. `hedgeLeg1.unmatched` <- `hedgeLeg1.stake`, `matchedStake`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`, `hedgeLeg1.cancelledStake`, `cancelledStake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`, `hedgeLeg1.cancelledStake`, `cancelledStake`
6. `hedgeLeg2.commission` <- `hedgeLeg1.commission`
7. `hedgeLeg2.odds` <- `newOdds`
8. `hedgeLeg2.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`, `hedgeLeg1.stake`, `hedgeLeg1.cancelledStake`, `hedgeLeg1.commission`, `rewardProjection.profitRetained`, `hedgeLeg2.odds`, `hedgeLeg2.commission`, `cancelledStake`
9. `hedgeLeg2.risk` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
10. `hedgeLeg2.profit` <- `hedgeLeg2.stake`
11. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`
12. `hedgeLeg1.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.profit`
13. `hedgeLeg2.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.profit`

- Notas de rama: escenario `UNMATCHED` añade recalculo de cobertura adicional.

## 33. `calculate_simple_matched_betting_standard_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:204`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`, `hedgeLeg1.commission`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
6. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
7. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 34. `calculate_simple_matched_betting_standard_no_promotion_unmatched`
- Fuente: `apps/frontend/src/utils/calculate.ts:114`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=UNMATCHED | profile=PF_SINGLE_UNMATCHED
- Parametros: `matchedStake: number`, `cancelledStake: number`, `newOdds: number`

**Triggers de recalculo**
- `cancelledStake`
- `cancelledStake: number`
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.commission`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `matchedStake`
- `matchedStake: number`
- `newOdds`
- `newOdds: number`

**Orden secuencial de calculo (codigo actual)**
1. `hedgeLeg1.cancelledStake` <- `(constante)`
2. `hedgeLeg1.unmatched` <- `hedgeLeg1.stake`
3. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`, `hedgeLeg1.cancelledStake`
4. `hedgeLeg1.profit` <- `hedgeLeg1.stake`, `hedgeLeg1.cancelledStake`
5. `hedgeLeg2.commission` <- `hedgeLeg1.commission`
6. `hedgeLeg2.odds` <- `(constante)`
7. `hedgeLeg2.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`, `hedgeLeg1.stake`, `hedgeLeg1.cancelledStake`, `hedgeLeg1.commission`, `hedgeLeg2.odds`
8. `hedgeLeg2.risk` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
9. `hedgeLeg2.profit` <- `hedgeLeg2.stake`
10. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`
11. `hedgeLeg1.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.profit`
12. `hedgeLeg2.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.profit`

- Notas de rama: escenario `UNMATCHED` añade recalculo de cobertura adicional.

## 35. `calculate_simple_matched_betting_standard_prepayment`
- Fuente: `apps/frontend/src/utils/calculate.ts:250`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=STANDARD | promoAction=NONE | rewardType=- | hedgeAdjustment=PREPAYMENT | profile=PF_SINGLE_PREPAYMENT
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `prepaymentLeg.commission`
- `prepaymentLeg.odds`
- `prepaymentLeg.stake`
- `prepaymentTriggered`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `mainLeg.stake`, `hedgeLeg1.odds`, `hedgeLeg1.commission`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
6. `prepaymentLeg.stake` <- `hedgeLeg1.profit`, `hedgeLeg1.risk`, `prepaymentLeg.odds`, `prepaymentLeg.commission`
7. `prepaymentLeg.risk` <- `prepaymentLeg.stake`
8. `prepaymentLeg.profit` <- `prepaymentLeg.odds`, `prepaymentLeg.stake`, `prepaymentLeg.commission`
9. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`
10. `hedgeLeg1.winBalance` <- `mainLeg.profit`, `hedgeLeg1.profit`, `prepaymentLeg.risk`
11. `prepaymentLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`

- Notas de rama: escenario `PREPAYMENT` introduce `prepaymentLeg` tras preliquidacion.

## 36. `calculate_simple_matched_betting_standard_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:220`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=STANDARD | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `(constante)`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.profit`, `hedgeLeg1.odds`, `hedgeLeg1.commission`
4. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
5. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
6. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
7. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 37. `calculate_simple_matched_betting_standard_use_freebet_unmatched`
- Fuente: `apps/frontend/src/utils/calculate.ts:142`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=STANDARD | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=UNMATCHED | profile=PF_SINGLE_UNMATCHED
- Parametros: `matchedStake`, `cancelledStake`, `newOdds`

**Triggers de recalculo**
- `cancelledStake`
- `hedgeLeg1.commission`
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `hedgeLeg2.commission`
- `hedgeLeg2.odds`
- `hedgeLeg2.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `matchedStake`
- `newOdds`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `hedgeLeg1.cancelledStake` <- `cancelledStake`
2. `hedgeLeg1.unmatched` <- `hedgeLeg1.stake`, `matchedStake`
3. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`, `hedgeLeg1.cancelledStake`, `cancelledStake`
4. `hedgeLeg1.profit` <- `hedgeLeg1.stake`, `hedgeLeg1.cancelledStake`, `cancelledStake`
5. `hedgeLeg2.commission` <- `hedgeLeg1.commission`
6. `hedgeLeg2.odds` <- `newOdds`
7. `hedgeLeg2.stake` <- `mainLeg.stake`, `mainLeg.odds`, `hedgeLeg1.odds`, `hedgeLeg1.stake`, `hedgeLeg1.cancelledStake`, `hedgeLeg1.commission`, `hedgeLeg2.odds`, `hedgeLeg2.commission`, `cancelledStake`
8. `hedgeLeg2.risk` <- `hedgeLeg2.odds`, `hedgeLeg2.stake`
9. `hedgeLeg2.profit` <- `hedgeLeg2.stake`
10. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `hedgeLeg2.risk`
11. `hedgeLeg1.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.profit`
12. `hedgeLeg2.winBalance` <- `mainLeg.risk`, `hedgeLeg1.profit`, `hedgeLeg2.profit`

- Notas de rama: escenario `UNMATCHED` añade recalculo de cobertura adicional.

## 38. `calculate_simple_matched_betting_underlay_generate_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:302`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=UNDERLAY | promoAction=GENERATE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE_GENERATE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.refundValue`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.refundRatio`
- `mainLeg.refundValue`
- `mainLeg.stake`
- `rewardGeneration.refundRatio`
- `rewardGeneration.refundValue`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `hedgeLeg1.odds`, `mainLeg.profit`, `mainLeg.refundRatio`, `mainLeg.refundValue`, `hedgeLeg1.refundValue`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
6. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
7. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`
8. `rewardProjection.hedge1FormfinalBalance` <- `hedgeLeg1.winBalance`, `rewardProjection.retainedProfit`

- Notas de rama: sin bifurcacion por estados de linea.

## 39. `calculate_simple_matched_betting_underlay_no_promotion`
- Fuente: `apps/frontend/src/utils/calculate.ts:276`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=UNDERLAY | promoAction=NONE | rewardType=- | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `hedgeLeg1.odds`, `mainLeg.stake`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
6. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
7. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## 40. `calculate_simple_matched_betting_underlay_prepayment`
- Fuente: `apps/frontend/src/utils/calculate.ts:322`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=UNDERLAY | promoAction=NONE | rewardType=- | hedgeAdjustment=PREPAYMENT | profile=PF_SINGLE_PREPAYMENT
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `prepaymentLeg.commission`
- `prepaymentLeg.odds`
- `prepaymentLeg.stake`
- `prepaymentTriggered`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.risk` <- `mainLeg.stake`
2. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
3. `hedgeLeg1.stake` <- `mainLeg.odds`, `hedgeLeg1.odds`, `mainLeg.stake`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
6. `prepaymentLeg.stake` <- `hedgeLeg1.profit`, `hedgeLeg1.risk`, `prepaymentLeg.odds`, `prepaymentLeg.commission`
7. `prepaymentLeg.risk` <- `prepaymentLeg.stake`
8. `prepaymentLeg.profit` <- `prepaymentLeg.odds`, `prepaymentLeg.stake`, `prepaymentLeg.commission`
9. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`
10. `hedgeLeg1.winBalance` <- `mainLeg.profit`, `hedgeLeg1.profit`, `prepaymentLeg.risk`
11. `prepaymentLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`, `prepaymentLeg.profit`

- Notas de rama: escenario `PREPAYMENT` introduce `prepaymentLeg` tras preliquidacion.

## 41. `calculate_simple_matched_betting_underlay_use_freebet`
- Fuente: `apps/frontend/src/utils/calculate.ts:291`
- Configuracion: strategy=MATCHED_BETTING | lineMode=SINGLE | dutchingOptions=- | mode=UNDERLAY | promoAction=USE_REWARD | rewardType=FREEBET | hedgeAdjustment=NONE | profile=PF_SINGLE_BASE
- Parametros: _ninguno_

**Triggers de recalculo**
- `hedgeLeg1.odds`
- `hedgeLeg1.stake`
- `mainLeg.odds`
- `mainLeg.stake`
- `rewardUsage.rewardType=FREEBET`
- `rewardUsage.type`

**Orden secuencial de calculo (codigo actual)**
1. `mainLeg.profit` <- `mainLeg.odds`, `mainLeg.stake`
2. `hedgeLeg1.stake` <- `mainLeg.profit`, `mainLeg.stake`, `hedgeLeg1.odds`
3. `hedgeLeg1.profit` <- `hedgeLeg1.stake`
4. `hedgeLeg1.risk` <- `hedgeLeg1.odds`, `hedgeLeg1.stake`
5. `mainLeg.winBalance` <- `mainLeg.profit`, `hedgeLeg1.risk`
6. `hedgeLeg1.winBalance` <- `hedgeLeg1.profit`, `mainLeg.risk`

- Notas de rama: sin bifurcacion por estados de linea.

## Checklist de siguiente paso
- [ ] Congelar `calculationFunctionId` (41 escenarios actuales).
- [ ] Definir selector determinista desde configuracion de formulario.
- [ ] Refactor a funciones puras (`input -> output`), sin estado global mutable.
- [ ] Alinear naming tecnico (`commission`) en motor y schemas.
- [ ] Crear tests unitarios por escenario (inputs/triggers/outputs esperados).
- [ ] Revisar formulas de reward distinto de FREEBET para extender cobertura.