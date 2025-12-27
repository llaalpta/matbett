# Documentación Completa del Sistema de Matched Betting

## Tabla de Contenidos

1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [Ciclo de Vida de Promociones](#ciclo-de-vida-de-promociones)
3. [Estrategias de Cobertura](#estrategias-de-cobertura)
4. [Tipos de Apuesta](#tipos-de-apuesta)
5. [Inventario Completo de Funciones](#inventario-completo-de-funciones)
6. [Casos de Uso Específicos](#casos-de-uso-específicos)
7. [Flujos de Ejecución](#flujos-de-ejecución)
8. [Parámetros de Entrada](#parámetros-de-entrada)

---

## Conceptos Fundamentales

### Terminología Básica

| Término            | Descripción                              | Ubicación                 |
| ------------------ | ---------------------------------------- | ------------------------- |
| **BackBet**        | Apuesta A FAVOR de un resultado          | Bookmaker promocional     |
| **LayBet**         | Apuesta EN CONTRA de un resultado        | Betfair Exchange          |
| **Hedge**          | Apuesta A FAVOR de resultados contrarios | Otros bookmakers          |
| **MainForm**       | Primera BackBet (activa promoción)       | Bookmaker principal       |
| **Main2Form**      | Segunda BackBet (asegurar beneficio)     | Bookmaker principal       |
| **Hedge1/2/3Form** | Apuestas de cobertura secuenciales       | Exchange/Otros bookmakers |

### Roles de Apuestas

```typescript
enum HedgeRole {
  MAIN = "MAIN", // mainForm - BackBet inicial
  HEDGE1 = "HEDGE1", // hedge1Form - Primera cobertura
  HEDGE2 = "HEDGE2", // hedge2Form - Segunda cobertura
  HEDGE3 = "HEDGE3", // hedge3Form - Tercera cobertura
}
```

### Variables Globales del Sistema

```javascript
// Apuesta principal
const mainForm = {
  stake: number,
  odds: number,
  commission: number,
  profit: number,
  risk: number,
  winBalance: number,
};

// Apuesta de prepago (solo para promociones de pago anticipado)
const main2Form = {
  stake: number,
  odds: number,
  commission: number,
  profit: number,
  risk: number,
  winBalance: number,
};

// Coberturas secuenciales
const hedge1Form = {
  stake: number,
  odds: number,
  commission: number,
  profit: number,
  risk: number,
  winBalance: number,
  unmatched: number, // Para casos unmatched
  cancelledStake: number, // Para casos unmatched
};

const hedge2Form = {
  /* misma estructura que hedge1Form */
};
const hedge3Form = {
  /* misma estructura que hedge1Form */
};

// Para promociones de freebets
const freeBet = {
  profitRetained: number,
  hedge1FormfinalBalance: number,
  hedge2FormfinalBalance: number,
  hedge3FormfinalBalance: number,
};

// Para apuestas combinadas
const combinedMainForm = {
  stake: number,
  odds: number, // Calculado como line1.odds * line2.odds * line3.odds
  commission: number,
  refundValue: number,
  refundRatio: number,
  profit: number,
  risk: number,
  winBalance: number,
  prepayment: boolean,
};

// Líneas de combinadas (datos de ejemplo/prueba)
const line1 = {
  event: string,
  market: string,
  selection: string,
  odds: number,
  status: string,
};
const line2 = {
  event: string,
  market: string,
  selection: string,
  odds: number,
  status: string,
};
const line3 = {
  event: string,
  market: string,
  selection: string,
  odds: number,
  status: string,
};
```

---

## Ciclo de Vida de Promociones

### Fase 1: QUALIFY (Calificar)

- **Objetivo**: Desbloquear recompensas con mínima pérdida
- **Estrategia**: Matched betting para cumplir requisitos
- **Resultado**: Freebet/bono disponible (-1€ a -3€ típicamente)
- **Funciones**: `*_no_promotion()` y `*_generate_freebet()`

### Fase 2: USE REWARD (Usar Recompensa)

- **Objetivo**: Beneficio garantizado usando la recompensa
- **Estrategia**: Matched betting para extraer valor
- **Resultado**: Ganancia neta (+5€ a +15€ típicamente)
- **Funciones**: `*_use_freebet()`

---

## Estrategias de Cobertura

### Matched Betting

- **BackBet**: A favor del Madrid en Sportium
- **LayBet**: EN CONTRA del Madrid en Betfair Exchange
- **Uso**: Promociones con freebets/bonos
- **Ventaja**: Acceso a toda la liquidez del exchange

### Dutching/Arbitraje

- **BackBet**: A favor del Madrid en Sportium
- **Hedge1**: A favor del Empate en Bet365
- **Hedge2**: A favor del Barcelona en William Hill
- **Uso**: Diferencias de cuotas entre bookmakers
- **Ventaja**: No depende de exchanges, más bookmakers disponibles

### Modos de Estrategia

#### STANDARD

- **Distribución equilibrada** de riesgos
- **Pérdida similar** en ambos escenarios
- **Uso**: Apuestas calificantes estándar

#### UNDERLAY

- **Minimizar pérdidas en bookmaker**
- Perder poco si gana BackBet, 0€ si pierde
- **Cuándo usar**: Promociones valiosas, proteger bookmaker promocional
- **Estrategia**: "Prefiero no perder dinero en la casa de la promo"

#### OVERLAY

- **Minimizar pérdidas en exchange**
- Perder 0€ si pierde BackBet, algo más si gana
- **Cuándo usar**: Confianza en promoción, proteger fondos del exchange
- **Estrategia**: "Confío en que la promoción compensará las pérdidas"

---

## Tipos de Apuesta

### Simple Bets

Una sola apuesta principal con sus coberturas correspondientes.

**Estructura básica:**

- `mainForm`: Apuesta principal
- `hedge1Form`: Cobertura principal
- `main2Form`: Solo para prepayment

### Combined Bets (Combinadas)

Apuestas múltiples donde se multiplican las cuotas:

```javascript
// Ejemplo: Madrid gana (1.5) + Barcelona gana (1.5) = Cuota combinada 2.25
Cuota Final = line1.odds × line2.odds × line3.odds
```

#### Método Secuencial

**Requisito**: Eventos NO solapados (mínimo 30 min diferencia)

**Flujo:**

1. Apostar combinada completa en bookmaker
2. Cubrir Line1 en exchange/otros bookmakers
3. **Si Line1 pierde**: Proceso terminado
4. **Si Line1 gana**: Cubrir Line2
5. **Si Line2 gana**: Cubrir Line3 (si existe)

**Ventajas:**

- Menor exposición de capital
- Puedes parar si falla una línea temprano
- Gestión de riesgo más granular

**Desventajas:**

- Requiere monitoreo activo
- Cuotas pueden cambiar entre líneas

#### Método Simultáneo

**Requisito**: Todos los eventos al mismo tiempo

**Flujo:**

- Cubrir todas las líneas inmediatamente
- No esperar resultados intermedios

**Ventajas:**

- Cuotas garantizadas
- No requiere monitoreo activo

**Desventajas:**

- Mayor exposición de capital
- No puedes beneficiarte de fallos tempranos

### Prepayment (Pago Anticipado)

Promociones que pagan antes del resultado final.

**Ejemplo típico - Bet365 "2 goles a favor":**

1. **mainForm**: Apostar a que el Getafe gana (10€ @ 2.20)
2. **hedge1Form**: Laybet contra Getafe en Betfair (@2.40)
3. **Si Getafe se pone 2-0**: Se activa el prepayment
4. **main2Form**: Nueva apuesta a favor del Getafe en vivo (calculada automáticamente)

**Estructura de cálculo:**

- Primero calcular mainForm + hedge1Form (pérdida controlada ~1€)
- Si se activa condición: calcular main2Form para beneficio garantizado
- Resultado final: ~6€ de beneficio sin importar resultado final

### Casos Unmatched

Cuando Betfair no empareja toda tu apuesta:

**Variables clave:**

- `matchedStake`: Cantidad realmente emparejada
- `cancelledStake`: Cantidad devuelta automáticamente
- `newOdds`: Nuevas cuotas disponibles para reemparejar

**Estrategia:**

1. Recalcular con `matchedStake` real
2. Buscar nuevas cuotas (`newOdds`)
3. Calcular `hedge2Form` adicional para cubrir el gap
4. Rebalancear toda la estrategia

---

## Inventario Completo de Funciones

### 1. Simple Matched Betting (15 funciones)

#### Standard Mode (4 funciones)

| Función                                                        | Promoción       | Descripción                    | Variables clave                              |
| -------------------------------------------------------------- | --------------- | ------------------------------ | -------------------------------------------- |
| `calculate_simple_matched_betting_standard_no_promotion()`     | Ninguna         | Apuesta calificante básica     | mainForm, hedge1Form                         |
| `calculate_simple_matched_betting_standard_use_freebet()`      | Usar Freebet    | Usar freebet existente         | mainForm (risk=0), hedge1Form                |
| `calculate_simple_matched_betting_standard_generate_freebet()` | Generar Freebet | Apostar para conseguir freebet | mainForm, hedge1Form, freeBet.profitRetained |
| `calculate_simple_matched_betting_standard_prepayment()`       | Pago Anticipado | Bet365 "2 goles", etc.         | mainForm, hedge1Form, main2Form              |

#### Underlay Mode (4 funciones)

| Función                                                        | Promoción       | Descripción                           | Objetivo                     |
| -------------------------------------------------------------- | --------------- | ------------------------------------- | ---------------------------- |
| `calculate_simple_matched_betting_underlay_no_promotion()`     | Ninguna         | Minimizar pérdida en bookmaker        | Proteger mainForm            |
| `calculate_simple_matched_betting_underlay_use_freebet()`      | Usar Freebet    | Proteger bookmaker usando freebet     | Maximizar valor freebet      |
| `calculate_simple_matched_betting_underlay_generate_freebet()` | Generar Freebet | Generar freebet protegiendo bookmaker | Conseguir freebet sin riesgo |
| `calculate_simple_matched_betting_underlay_prepayment()`       | Pago Anticipado | Prepago protegiendo bookmaker         | Proteger hasta activación    |

#### Overlay Mode (4 funciones)

| Función                                                       | Promoción       | Descripción                          | Objetivo                      |
| ------------------------------------------------------------- | --------------- | ------------------------------------ | ----------------------------- |
| `calculate_simple_matched_betting_overlay_no_promotion()`     | Ninguna         | Minimizar pérdida en exchange        | Proteger hedge1Form           |
| `calculate_simple_matched_betting_overlay_use_freebet()`      | Usar Freebet    | Proteger exchange usando freebet     | Usar freebet agresivamente    |
| `calculate_simple_matched_betting_overlay_generate_freebet()` | Generar Freebet | Generar freebet protegiendo exchange | Apostar agresivo para freebet |
| `calculate_simple_matched_betting_overlay_prepayment()`       | Pago Anticipado | Prepago protegiendo exchange         | Confiar en la promoción       |

#### Unmatched Scenarios (3 funciones)

| Función                                                                                                       | Descripción                                      | Parámetros adicionales                |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| `calculate_simple_matched_betting_standard_no_promotion_unmatched(matchedStake, cancelledStake, newOdds)`     | Stake parcialmente emparejado, sin promoción     | matchedStake, cancelledStake, newOdds |
| `calculate_simple_matched_betting_standard_use_freebet_unmatched(matchedStake, cancelledStake, newOdds)`      | Stake parcialmente emparejado, usando freebet    | matchedStake, cancelledStake, newOdds |
| `calculate_simple_matched_betting_standard_generate_freebet_unmatched(matchedStake, cancelledStake, newOdds)` | Stake parcialmente emparejado, generando freebet | matchedStake, cancelledStake, newOdds |

### 2. Simple Dutching 2 Opciones (10 funciones)

#### Standard Mode (4 funciones)

| Función                                                           | Promoción       | Descripción                      | Estructura                        |
| ----------------------------------------------------------------- | --------------- | -------------------------------- | --------------------------------- |
| `calculate_simple_dutching_2_options_standard_no_promotion()`     | Ninguna         | Arbitraje básico 2 resultados    | mainForm + hedge1Form             |
| `calculate_simple_dutching_2_options_standard_use_freebet()`      | Usar Freebet    | Arbitraje usando freebet         | mainForm (freebet) + hedge1Form   |
| `calculate_simple_dutching_2_options_standard_generate_freebet()` | Generar Freebet | Arbitraje para conseguir freebet | mainForm + hedge1Form + freeBet   |
| `calculate_simple_dutching_2_options_standard_prepayment()`       | Pago Anticipado | Arbitraje con prepago            | mainForm + hedge1Form + main2Form |

#### Underlay Mode (3 funciones)

| Función                                                       | Promoción       | Descripción                          | Objetivo                      |
| ------------------------------------------------------------- | --------------- | ------------------------------------ | ----------------------------- |
| `calculate_simple_dutching_2_options_underlay_no_promotion()` | Ninguna         | Arbitraje protegiendo casa principal | Minimizar pérdida en mainForm |
| `calculate_simple_dutching_2_options_underlay_use_freebet()`  | Usar Freebet    | Freebet protegiendo casa principal   | Usar freebet sin riesgo       |
| `calculate_simple_dutching_2_options_underlay_prepayment()`   | Pago Anticipado | Prepago protegiendo casa principal   | Proteger hasta activación     |

#### Overlay Mode (3 funciones)

| Función                                                      | Promoción       | Descripción                             | Objetivo                        |
| ------------------------------------------------------------ | --------------- | --------------------------------------- | ------------------------------- |
| `calculate_simple_dutching_2_options_overlay_no_promotion()` | Ninguna         | Arbitraje protegiendo casas secundarias | Minimizar pérdida en hedge1Form |
| `calculate_simple_dutching_2_options_overlay_use_freebet()`  | Usar Freebet    | Freebet protegiendo casas secundarias   | Apostar freebet agresivamente   |
| `calculate_simple_dutching_2_options_overlay_prepayment()`   | Pago Anticipado | Prepago protegiendo casas secundarias   | Confiar en promoción            |

### 3. Simple Dutching 3 Opciones (4 funciones)

#### Standard Mode (3 funciones)

| Función                                                           | Promoción       | Descripción                         | Estructura                                   |
| ----------------------------------------------------------------- | --------------- | ----------------------------------- | -------------------------------------------- |
| `calculate_simple_dutching_3_options_standard_no_promotion()`     | Ninguna         | Arbitraje básico 3 resultados       | mainForm + hedge1Form + hedge2Form           |
| `calculate_simple_dutching_3_options_standard_use_freebet()`      | Usar Freebet    | Arbitraje 3 opciones usando freebet | mainForm (freebet) + hedge1Form + hedge2Form |
| `calculate_simple_dutching_3_options_standard_generate_freebet()` | Generar Freebet | Arbitraje 3 opciones para freebet   | mainForm + hedge1Form + hedge2Form + freeBet |

#### Underlay Mode (1 función)

| Función                                                       | Promoción | Descripción                                | Uso típico             |
| ------------------------------------------------------------- | --------- | ------------------------------------------ | ---------------------- |
| `calculate_simple_dutching_3_options_underlay_no_promotion()` | Ninguna   | Arbitraje 3 opciones protegiendo principal | Mercados 1X2 en fútbol |

### 4. Combined 2 Líneas - Dutching (3 funciones)

| Función                                                                                   | Promoción       | Descripción                       | Parámetros               |
| ----------------------------------------------------------------------------------------- | --------------- | --------------------------------- | ------------------------ |
| `calculate_combined_2_lines_dutching_standard_no_promotion(line1Status, line2Status)`     | Ninguna         | Combinada 2 líneas con arbitraje  | line1Status, line2Status |
| `calculate_combined_2_lines_dutching_standard_use_freebet(line1Status, line2Status)`      | Usar Freebet    | Combinada 2 líneas usando freebet | line1Status, line2Status |
| `calculate_combined_2_lines_dutching_standard_generate_freebet(line1Status, line2Status)` | Generar Freebet | Combinada 2 líneas para freebet   | line1Status, line2Status |

**Estados de línea posibles:**

- `'won'`: La línea ganó
- `'lost'`: La línea perdió
- `'pending'`: La línea aún no tiene resultado

**Lógica de cálculo por escenarios:**

```javascript
if (line1Status === "lost") {
  // Solo hedge1 gana, combinada falló
  hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
} else if (line1Status === "won") {
  if (line2Status === "lost") {
    // hedge2 gana, combinada falló en línea 2
    hedge2Form.winBalance =
      combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
  } else if (line2Status === "won") {
    // Combinada completa ganó
    combinedMainForm.winBalance =
      combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk;
  }
}
```

### 5. Combined 2 Líneas - Matched Betting (3 funciones)

| Función                                                                                          | Promoción       | Descripción                            | Diferencia vs Dutching                     |
| ------------------------------------------------------------------------------------------------ | --------------- | -------------------------------------- | ------------------------------------------ |
| `calculate_combined_2_lines_matched_betting_standard_no_promotion(line1Status, line2Status)`     | Ninguna         | Combinada 2 líneas con matched betting | Usa exchanges en lugar de otros bookmakers |
| `calculate_combined_2_lines_matched_betting_standard_use_freebet(line1Status, line2Status)`      | Usar Freebet    | Combinada 2 líneas usando freebet      | combinedMainForm.risk = 0                  |
| `calculate_combined_2_lines_matched_betting_standard_generate_freebet(line1Status, line2Status)` | Generar Freebet | Combinada 2 líneas para freebet        | Incluye freeBet.profitRetained             |

**Diferencias clave en el cálculo:**

```javascript
// Matched Betting: Laybet calculation
hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

// Dutching: Back bet calculation
hedge1Form.risk = -hedge1Form.stake;
hedge1Form.profit =
  (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) *
  hedge1FormComissionRate;
```

### 6. Combined 3 Líneas - Matched Betting (3 funciones)

| Función                                                                                                       | Promoción       | Descripción                            | Estructura                                              |
| ------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------- | ------------------------------------------------------- |
| `calculate_combined_3_lines_matched_betting_standard_no_promotion(line1Status, line2Status, line3Status)`     | Ninguna         | Combinada 3 líneas con matched betting | combinedMainForm + hedge1Form + hedge2Form + hedge3Form |
| `calculate_combined_3_lines_matched_betting_standard_use_freebet(line1Status, line2Status, line3Status)`      | Usar Freebet    | Combinada 3 líneas usando freebet      | combinedMainForm.risk = 0                               |
| `calculate_combined_3_lines_matched_betting_standard_generate_freebet(line1Status, line2Status, line3Status)` | Generar Freebet | Combinada 3 líneas para freebet        | Incluye freeBet en todos los escenarios                 |

**Lógica de escenarios (3 líneas):**

```javascript
if (line1Status === "lost") {
  hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
} else if (line1Status === "won") {
  if (line2Status === "lost") {
    hedge2Form.winBalance =
      combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
  } else if (line2Status === "won") {
    if (line3Status === "lost") {
      hedge3Form.winBalance =
        combinedMainForm.risk +
        hedge1Form.risk +
        hedge2Form.risk +
        hedge3Form.profit;
    } else if (line3Status === "won") {
      combinedMainForm.winBalance =
        combinedMainForm.profit +
        hedge1Form.risk +
        hedge2Form.risk +
        hedge3Form.risk;
    }
  }
}
```

### 7. Combined 3 Líneas - Dutching (3 funciones)

| Función                                                                                                | Promoción       | Descripción                       | Uso típico                                  |
| ------------------------------------------------------------------------------------------------------ | --------------- | --------------------------------- | ------------------------------------------- |
| `calculate_combined_3_lines_dutching_standard_no_promotion(line1Status, line2Status, line3Status)`     | Ninguna         | Combinada 3 líneas con arbitraje  | Supercuotas en múltiples mercados           |
| `calculate_combined_3_lines_dutching_standard_use_freebet(line1Status, line2Status, line3Status)`      | Usar Freebet    | Combinada 3 líneas usando freebet | Maximizar valor freebet en combinadas       |
| `calculate_combined_3_lines_dutching_standard_generate_freebet(line1Status, line2Status, line3Status)` | Generar Freebet | Combinada 3 líneas para freebet   | Promociones que requieren combinadas largas |

---

## **TOTAL: 44 Funciones de Cálculo**

---

## Casos de Uso Específicos

### Cuándo usar cada estrategia:

#### Simple Matched Betting

✅ **Usar cuando:**

- Tienes acceso a Betfair Exchange
- Hay buena liquidez en el mercado
- Promociones con freebets/bonos
- Quieres la máxima precisión en coberturas

❌ **No usar cuando:**

- No tienes cuenta en Betfair
- Poca liquidez en el mercado
- Comisiones muy altas del exchange

#### Simple Dutching

✅ **Usar cuando:**

- Sin acceso a exchanges
- Múltiples bookmakers con buenas cuotas
- Mercados de 3 opciones (1X2)
- Arbitraje puro sin promociones

❌ **No usar cuando:**

- Solo tienes acceso a 1-2 bookmakers
- Las cuotas no permiten arbitraje
- Mercados de solo 2 opciones

#### Combined Bets

✅ **Usar cuando:**

- Promociones específicas de combinadas
- Supercuotas promocionales
- Cuotas incrementadas especiales
- Offers que requieren múltiples selecciones

❌ **No usar cuando:**

- Alto riesgo de fallos en líneas
- Poca diferencia horaria entre eventos
- Bankroll limitado para coberturas

#### Prepayment

✅ **Usar cuando:**

- Bet365 "2 goles a favor"
- Promociones de "primer goleador"
- Cualquier pago anticipado por condición
- Tienes tiempo para monitorear eventos

❌ **No usar cuando:**

- No puedes monitorear el evento
- Las condiciones son muy improbables
- No tienes liquidez para main2Form

### Cuándo usar Secuencial vs Simultáneo:

#### Método Secuencial

✅ **Obligatorio cuando:**

- Eventos solapados en tiempo
- Necesitas conocer resultado anterior
- Bankroll limitado
- Quieres minimizar exposición

**Ejemplo típico:**

```
17:00 - Real Madrid vs Barcelona (Línea 1)
19:30 - Chelsea vs City (Línea 2)
```

#### Método Simultáneo

✅ **Preferible cuando:**

- Eventos simultáneos o muy cercanos
- Bankroll suficiente
- Quieres garantizar cobertura
- Cuotas pueden cambiar rápidamente

**Ejemplo típico:**

```
15:00 - Múltiples partidos de Premier League
15:00 - Múltiples partidos de La Liga
```

### Cuándo usar cada Modo:

#### Standard

✅ **Usar cuando:**

- Primera vez con una promoción
- Distribución equilibrada de riesgos
- Bankroll balanceado entre casas
- Apuestas calificantes estándar

#### Underlay

✅ **Usar cuando:**

- Promoción muy valiosa (>10€ expected value)
- Quieres proteger cuenta del bookmaker promocional
- Maximizar valor de freebets importantes
- La promoción tiene alta probabilidad de activarse

**Ejemplo:** Promoción Bet365 "2 goles a favor" en Real Madrid vs Granada (Madrid favorito claro)

#### Overlay

✅ **Usar cuando:**

- Muy confiado en que la promoción se activará
- Quieres proteger fondos del exchange
- El bookmaker tiene mejores cuotas base
- Tienes historial positivo con esa promoción

**Ejemplo:** Usando una freebet de 50€ en una apuesta con 90% probabilidad de activar bonus

---

## Flujos de Ejecución

### Flujo Simple Matched Betting

```
1. Seleccionar evento y mercado
2. Identificar tipo de promoción
3. Configurar parámetros base (stake, odds, commission)
4. Seleccionar función de cálculo apropiada:
   - No promoción: calculate_simple_matched_betting_standard_no_promotion()
   - Usar Freebet: calculate_simple_matched_betting_standard_use_freebet()
   - Generar Freebet: calculate_simple_matched_betting_standard_generate_freebet()
   - Prepayment: calculate_simple_matched_betting_standard_prepayment()
5. Ejecutar mainForm en bookmaker
6. Ejecutar hedge1Form en exchange
7. Si prepayment: Monitorear condición de activación
8. Si se activa: Ejecutar main2Form calculado
9. Completar proceso y registrar resultados
```

### Flujo Combined Bets Secuencial

```
1. Seleccionar eventos NO solapados (mínimo 30min diferencia)
2. Configurar combinada en bookmaker
3. Calcular cobertura total con función apropiada
4. Ejecutar combinada (mainForm) en bookmaker
5. Ejecutar hedge1Form para Line1
6. ESPERAR resultado de Line1:
   a. Si Line1 pierde: Proceso terminado (hedge1 gana)
   b. Si Line1 gana: Continuar a paso 7
7. Ejecutar hedge2Form para Line2
8. ESPERAR resultado de Line2:
   a. Si Line2 pierde: Proceso terminado (hedge2 gana)
   b. Si Line2 gana y no hay Line3: Combinada gana completa
   c. Si Line2 gana y hay Line3: Continuar a paso 9
9. Ejecutar hedge3Form para Line3
10. ESPERAR resultado de Line3:
    a. Si Line3 pierde: hedge3 gana
    b. Si Line3 gana: Combinada gana completa
```

### Flujo Combined Bets Simultáneo

```
1. Seleccionar eventos simultáneos o muy cercanos
2. Configurar combinada en bookmaker
3. Calcular todas las coberturas inmediatamente
4. Ejecutar TODAS las apuestas al mismo tiempo:
   - mainForm (combinada) en bookmaker
   - hedge1Form para Line1
   - hedge2Form para Line2
   - hedge3Form para Line3 (si existe)
5. Esperar resultados finales de todos los eventos
6. El beneficio está garantizado independientemente de resultados
```

### Flujo Unmatched

```
1. Ejecutar apuesta en Betfair
2. Verificar si se emparejó completamente:
   a. Si SÍ: Continuar flujo normal
   b. Si NO: Continuar a paso 3
3. Recibir notificación de cancelledStake
4. Recalcular estrategia:
   - matchedStake = stake original - cancelledStake
   - Buscar newOdds disponibles
5. Ejecutar función *_unmatched apropiada
6. Calcular hedge2Form adicional si es necesario
7. Ejecutar apuestas adicionales
8. Continuar con flujo normal
```

### Flujo Prepayment Detallado

```
1. Identificar promoción de pago anticipado
2. Configurar mainForm + hedge1Form inicial
3. Ejecutar apuestas iniciales (pequeña pérdida ~1€)
4. Monitorear evento en TIEMPO REAL
5. Cuando se activa la condición (ej: 2-0 a favor):
   a. Marcar prepayment = true en el sistema
   b. Obtener cuotas en vivo del evento
   c. Calcular main2Form automáticamente
6. Ejecutar main2Form inmediatamente
7. Resultado: Beneficio garantizado (~6€) independiente del resultado final
```

---

## Parámetros de Entrada

### Variables Comunes (Todas las funciones)

```typescript
interface CommonParams {
  // Variables globales del sistema modificadas por las funciones
  mainForm: {
    stake: number; // Cantidad a apostar
    odds: number; // Cuota de la apuesta principal
    commission: number; // Comisión del bookmaker (0-5%)
  };

  hedge1Form: {
    odds: number; // Cuota de la cobertura
    commission: number; // Comisión del exchange/bookmaker (2-6%)
  };
}
```

### Variables Específicas por Tipo

#### Prepayment Functions

```typescript
interface PrepaymentParams extends CommonParams {
  prepayment: boolean; // Si está activado el pago anticipado
  main2Form: {
    odds: number; // Cuotas en vivo (ej: 1.50 tras 2-0)
    commission: number; // Comisión para la apuesta adicional
  };
}
```

#### Freebet Functions

```typescript
interface FreebetParams extends CommonParams {
  // Para generate_freebet:
  mainForm: {
    refundValue: number; // Valor de la freebet a generar (ej: 10€)
    refundRatio: number; // % retenido por el usuario (75% = 0.75)
  };

  // Para use_freebet:
  mainForm: {
    risk: 0; // Sin riesgo al usar freebet
  };
}
```

#### Unmatched Functions

```typescript
interface UnmatchedParams extends CommonParams {
  // Parámetros adicionales de la función
  matchedStake: number; // Cantidad realmente emparejada
  cancelledStake: number; // Cantidad devuelta por Betfair
  newOdds: number; // Nuevas cuotas disponibles

  // Variables modificadas internamente
  hedge1Form: {
    unmatched: number; // hedge1Form.stake - matchedStake
    cancelledStake: number; // Copia del parámetro
  };

  hedge2Form: {
    odds: number; // Usa newOdds
    commission: number; // Usa misma comisión que hedge1Form
  };
}
```

#### Combined Bets Functions

```typescript
interface CombinedParams extends CommonParams {
  // Parámetros de la función
  line1Status: "won" | "lost";
  line2Status: "won" | "lost";
  line3Status?: "won" | "lost"; // Solo para funciones de 3 líneas

  // Variables globales usadas
  combinedMainForm: {
    stake: number;
    odds: number; // line1.odds * line2.odds * line3.odds
    commission: number;
    refundValue?: number; // Para generate_freebet
    refundRatio?: number; // Para generate_freebet
  };

  line1: { odds: number };
  line2: { odds: number };
  line3?: { odds: number }; // Solo para 3 líneas
}
```

### Dutching vs Matched Betting - Diferencias en Cálculos

#### Matched Betting (Exchange)

```javascript
// LayBet calculation
hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

// Stake calculation
hedge1Form.stake =
  (mainForm.odds * mainForm.stake) /
  (hedge1Form.odds - hedge1Form.commission / 100);
```

#### Dutching (Other Bookmakers)

```javascript
// BackBet calculation
hedge1Form.risk = -hedge1Form.stake;
hedge1Form.profit =
  (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) *
  hedge1FormComissionRate;

// Stake calculation for 2 options
hedge1Form.stake =
  (mainForm.odds * mainForm.stake * mainFormComissionRate) /
  (hedge1FormComissionRate * hedge1Form.odds - hedge1FormComissionRate + 1);
```

### Salidas Calculadas (Todas las funciones)

Todas las funciones modifican las variables globales y calculan:

```typescript
interface CalculatedOutputs {
  // Para cada forma (main, hedge1, hedge2, hedge3, main2)
  [form]: {
    stake: number; // Calculado automáticamente (excepto mainForm.stake)
    profit: number; // Ganancia si esta apuesta gana
    risk: number; // Pérdida si esta apuesta pierde
    winBalance: number; // Balance neto si esta apuesta gana
  };

  // Para funciones de freebets
  freeBet?: {
    profitRetained: number; // Valor retenido de la freebet
    hedge1FormfinalBalance: number; // Balance final incluyendo freebet
    hedge2FormfinalBalance: number; // Para múltiples hedges
    hedge3FormfinalBalance: number; // Para múltiples hedges
  };
}
```

### Valores Típicos de Referencia

```typescript
// Comisiones típicas
const TYPICAL_COMMISSIONS = {
  bookmaker: 0, // 0% - Los bookmakers no cobran comisión
  betfair: 2, // 2% - Comisión estándar de Betfair
  smarkets: 2, // 2% - Comisión de Smarkets
  matchbook: 1.5, // 1.5% - Comisión de Matchbook
};

// Stakes típicos
const TYPICAL_STAKES = {
  qualifying: 10, // 10€ - Apuesta calificante estándar
  freebet_small: 5, // 5€ - Freebet pequeña
  freebet_medium: 10, // 10€ - Freebet mediana
  freebet_large: 25, // 25€ - Freebet grande
  arbitrage: 100, // 100€ - Arbitraje con capital
};

// Refund ratios típicos
const TYPICAL_REFUND_RATIOS = {
  sportium: 75, // 75% - SNR típico Sportium
  bet365: 100, // 100% - Promociones directas
  william_hill: 80, // 80% - Término medio
};
```

---

## Ejemplos Prácticos

### Ejemplo 1: Simple Matched Betting - Use Freebet

```javascript
// Configuración inicial
mainForm.stake = 10; // Freebet de 10€
mainForm.odds = 2.0; // Cuota 2.0 en el evento
mainForm.commission = 0; // Sin comisión en bookmaker
hedge1Form.odds = 2.1; // Cuota contra en Betfair
hedge1Form.commission = 2; // 2% comisión Betfair

// Ejecutar cálculo
calculate_simple_matched_betting_standard_use_freebet();

// Resultado esperado:
mainForm.risk = 0; // Sin riesgo (es freebet)
mainForm.profit = 10; // 10€ de ganancia si gana
hedge1Form.stake = 9.52; // Calculado automáticamente
hedge1Form.profit = 9.33; // Ganancia si gana el laybet
hedge1Form.risk = -10.48; // Pérdida si pierde el laybet

// Balance final: ~9€ garantizados
```

### Ejemplo 2: Prepayment - Bet365 "2 goles a favor"

```javascript
// Fase 1: Configuración inicial
mainForm.stake = 10; // Apostar a favor del Getafe
mainForm.odds = 2.2; // Cuota del Getafe
hedge1Form.odds = 2.4; // Contra Getafe en Betfair
hedge1Form.commission = 2; // 2% comisión

calculate_simple_matched_betting_standard_prepayment();

// Resultado Fase 1: -0.94€ (pérdida controlada)

// Fase 2: Se activa prepayment (Getafe 2-0)
main2Form.odds = 1.5; // Cuota en vivo del Getafe
prepayment = true;

// main2Form.stake se calcula automáticamente: 14.79€
// Balance final: +6.45€ garantizados independientemente del resultado
```

### Ejemplo 3: Combined 2 Lines - Sequential

```javascript
// Configuración
line1 = { odds: 1.5 }; // Madrid gana
line2 = { odds: 1.5 }; // Barcelona gana
combinedMainForm.stake = 10; // Combinada de 10€
combinedMainForm.odds = 2.25; // 1.5 * 1.5

// Ejecutar cálculo inicial
calculate_combined_2_lines_matched_betting_standard_generate_freebet(
  "pending",
  "pending"
);

// Resultado:
hedge1Form.stake = 9.12; // Contra Madrid
hedge2Form.stake = 14.24; // Contra Barcelona (solo si Madrid gana)

// Escenarios:
// Madrid pierde: hedge1 gana, pérdida -1.06€
// Madrid gana, Barcelona pierde: hedge2 gana, pérdida -1.06€
// Madrid gana, Barcelona gana: combinada gana, pérdida -1.06€
// En todos los casos: -1.06€ compensado con freebet de 10€ = +8.94€ neto
```

### Ejemplo 4: Simple Dutching 3 Options - Standard

```javascript
// Configuración para mercado 1X2
mainForm.stake = 20; // Apostar al Madrid
mainForm.odds = 2.0; // Cuota Madrid
mainForm.commission = 0; // Sin comisión

hedge1Form.odds = 3.5; // Cuota Empate en otro bookmaker
hedge1Form.commission = 0; // Sin comisión

hedge2Form.odds = 4.0; // Cuota Barcelona en otro bookmaker
hedge2Form.commission = 0; // Sin comisión

calculate_simple_dutching_3_options_standard_no_promotion();

// Resultado esperado:
hedge1Form.stake = 11.43; // Calculado para el empate
hedge2Form.stake = 10.0; // Calculado para Barcelona

// Balance garantizado en cualquier resultado: ~-0.50€ a 0€
// (Pérdida mínima para oportunidades de arbitraje puro)
```

### Ejemplo 5: Unmatched Scenario

```javascript
// Configuración inicial
mainForm.stake = 50;
mainForm.odds = 2.0;
hedge1Form.odds = 2.1;
hedge1Form.commission = 2;

calculate_simple_matched_betting_standard_no_promotion();

// Se ejecuta en Betfair pero solo se emparejan 30€
matchedStake = 30;
cancelledStake = 20;
newOdds = 2.2; // Nuevas cuotas disponibles

// Recalcular con función unmatched
calculate_simple_matched_betting_standard_no_promotion_unmatched(
  matchedStake,
  cancelledStake,
  newOdds
);

// Resultado:
hedge1Form.stake = 30; // Stake original emparejado
hedge1Form.unmatched = 20; // Cantidad no emparejada
hedge2Form.stake = 18.18; // Nueva cobertura con newOdds
hedge2Form.odds = 2.2; // Usando las nuevas cuotas

// Balance total rebalanceado para mantener beneficio garantizado
```

### Ejemplo 6: Combined 3 Lines - Dutching con Freebet

```javascript
// Configuración de combinada triple
line1 = { odds: 1.8 }; // PSG gana
line2 = { odds: 1.6 }; // Bayern gana
line3 = { odds: 1.5 }; // City gana
combinedMainForm.stake = 20; // Freebet de 20€
combinedMainForm.odds = 4.32; // 1.8 * 1.6 * 1.5
combinedMainForm.commission = 0;

// Cuotas para coberturas
hedge1Form.odds = 1.9; // Contra PSG
hedge2Form.odds = 1.7; // Contra Bayern
hedge3Form.odds = 1.6; // Contra City

calculate_combined_3_lines_dutching_standard_use_freebet(
  "pending",
  "pending",
  "pending"
);

// Resultado:
hedge1Form.stake = 45.47; // Cobertura línea 1
hedge2Form.stake = 50.82; // Cobertura línea 2 (si línea 1 gana)
hedge3Form.stake = 53.94; // Cobertura línea 3 (si líneas 1 y 2 ganan)

// Escenarios:
// Línea 1 pierde: Beneficio ~40€
// Línea 2 pierde: Beneficio ~35€
// Línea 3 pierde: Beneficio ~30€
// Todas ganan: Beneficio ~65€

// Beneficio garantizado usando freebet sin riesgo de capital propio
```

### Ejemplo 7: Underlay Mode - Proteger Bookmaker

```javascript
// Promoción valiosa en Sportium (esperamos conseguir 20€ freebet)
mainForm.stake = 10;
mainForm.odds = 2.5;
mainForm.commission = 0;
mainForm.refundValue = 20; // Freebet esperada
mainForm.refundRatio = 0.75; // 75% SNR

hedge1Form.odds = 2.7;
hedge1Form.commission = 2;

calculate_simple_matched_betting_underlay_generate_freebet();

// Resultado (modo underlay):
mainForm.winBalance = -0.1; // Casi 0€ si gana mainForm
hedge1Form.winBalance = -1.5; // Pérdida mayor en exchange

// Estrategia: Minimizar riesgo en Sportium
// Si mainForm gana: -0.10€
// Si hedge1Form gana: -1.50€
// Compensado con freebet de 20€ * 0.75 = 15€ valor real
// Beneficio neto esperado: ~13€
```

### Ejemplo 8: Overlay Mode - Confiar en Promoción

```javascript
// Muy confiados en que conseguiremos la promoción
mainForm.stake = 10;
mainForm.odds = 2.5;
mainForm.commission = 0;
mainForm.refundValue = 20;
mainForm.refundRatio = 0.75;

hedge1Form.odds = 2.7;
hedge1Form.commission = 2;

calculate_simple_matched_betting_overlay_generate_freebet();

// Resultado (modo overlay):
mainForm.winBalance = -2.0; // Pérdida mayor si gana mainForm
hedge1Form.winBalance = -0.1; // Casi 0€ si gana hedge1Form

// Estrategia: Minimizar riesgo en Exchange
// Si mainForm gana: -2.00€
// Si hedge1Form gana: -0.10€
// Compensado con freebet de 20€ * 0.75 = 15€ valor real
// Beneficio neto esperado: ~13€

// Preferimos perder en bookmaker porque confiamos en la promoción
```

---

## Resumen de Decisiones

### Árbol de Decisión para Seleccionar Función

```
¿Tienes acceso a Exchange?
├─ SÍ → ¿Cuántas opciones tiene el mercado?
│       ├─ 2 opciones → Simple Matched Betting (15 funciones)
│       └─ 3+ opciones → Simple Dutching 3 Options (4 funciones)
│
└─ NO → ¿Cuántas opciones tiene el mercado?
        ├─ 2 opciones → Simple Dutching 2 Options (10 funciones)
        └─ 3 opciones → Simple Dutching 3 Options (4 funciones)

¿Es una apuesta combinada?
├─ SÍ → ¿Cuántas líneas?
│       ├─ 2 líneas → ¿Matched o Dutching?
│       │             ├─ Matched → Combined 2 Lines MB (3 funciones)
│       │             └─ Dutching → Combined 2 Lines Dutching (3 funciones)
│       │
│       └─ 3 líneas → ¿Matched o Dutching?
│                     ├─ Matched → Combined 3 Lines MB (3 funciones)
│                     └─ Dutching → Combined 3 Lines Dutching (3 funciones)
│
└─ NO → Ver árbol anterior

¿Qué tipo de promoción?
├─ Ninguna → *_no_promotion()
├─ Usar Freebet existente → *_use_freebet()
├─ Generar Freebet → *_generate_freebet()
└─ Pago Anticipado → *_prepayment()

¿Qué modo de riesgo?
├─ Equilibrado → *_standard_*
├─ Proteger Bookmaker → *_underlay_*
└─ Proteger Exchange → *_overlay_*

¿Problema con emparejamiento?
├─ SÍ → *_unmatched(matchedStake, cancelledStake, newOdds)
└─ NO → Función estándar correspondiente
```

---

## Glosario de Términos

| Término             | Definición                                                   |
| ------------------- | ------------------------------------------------------------ |
| **SNR**             | Stake Not Returned - Freebet donde no se devuelve la apuesta |
| **SR**              | Stake Returned - Freebet donde sí se devuelve la apuesta     |
| **Qualifying Bet**  | Apuesta calificante para desbloquear promociones             |
| **Commission Rate** | Tasa de comisión (ej: 2% = 0.98 de retención)                |
| **Liability**       | Responsabilidad máxima en una laybet                         |
| **Matched**         | Apuesta emparejada completamente en exchange                 |
| **Unmatched**       | Apuesta parcialmente emparejada en exchange                  |
| **Prepayment**      | Pago anticipado antes del resultado final                    |
| **Refund Value**    | Valor de la freebet/bono a recibir                           |
| **Refund Ratio**    | % del valor de freebet que se retiene (SNR vs SR)            |
| **Win Balance**     | Balance neto si una apuesta específica gana                  |
| **Risk**            | Pérdida si una apuesta específica pierde                     |
| **Profit**          | Ganancia si una apuesta específica gana                      |
| **Stake**           | Cantidad apostada                                            |
| **Odds**            | Cuota de la apuesta                                          |

---

## Buenas Prácticas

### Gestión de Bankroll

1. **Nunca apostar más del 5% del bankroll** en una sola estrategia
2. **Mantener fondos separados** por bookmaker y exchange
3. **Buffer de seguridad**: Siempre tener 20% extra para imprevistos
4. **Tracking detallado**: Registrar todas las operaciones

### Selección de Eventos

1. **Liquidez**: Verificar liquidez en Betfair antes de comprometerse
2. **Timing**: Apuestas combinadas con mínimo 30min diferencia
3. **Cuotas**: Verificar cuotas en múltiples fuentes
4. **Estabilidad**: Evitar mercados muy volátiles cerca del evento

### Ejecución

1. **Orden de apuestas**: Siempre LayBet primero (protege la principal)
2. **Verificación**: Doble check de odds y stakes antes de confirmar
3. **Screenshots**: Capturar evidencia de todas las apuestas
4. **Monitoreo**: Alertas para cambios de cuotas o condiciones

### Seguridad de Cuenta

1. **Gubbing prevention**: Variar stakes, no siempre números redondos
2. **Patrón natural**: Mezclar matched betting con apuestas normales
3. **Límites**: No abusar de una sola promoción
4. **Rotación**: Distribuir actividad entre varios bookmakers

---

## Troubleshooting Común

### Problema: "Mi laybet no se emparejó completamente"

**Solución**: Usar función `*_unmatched()` correspondiente

```javascript
calculate_simple_matched_betting_standard_no_promotion_unmatched(
  matchedStake,
  cancelledStake,
  newOdds
);
```

### Problema: "Las cuotas cambiaron después de mi cálculo"

**Solución**: Recalcular con las nuevas cuotas antes de apostar

- Verificar que el arbitraje sigue siendo rentable
- Ajustar stakes si es necesario

### Problema: "¿Cuándo usar Secuencial vs Simultáneo?"

**Regla simple**:

- Eventos con >30min diferencia → Secuencial
- Eventos simultáneos → Simultáneo
- Bankroll limitado → Secuencial
- Cuotas volátiles → Simultáneo

### Problema: "No sé qué modo usar (Standard/Underlay/Overlay)"

**Guía rápida**:

- Primera vez con promo → Standard
- Promo muy valiosa (>15€) → Underlay
- Muy confiado en promo → Overlay
- Dudas → Standard siempre es seguro

### Problema: "¿Cuánto beneficio esperado debería tener?"

**Referencias**:

- Qualifying bet: -0.50€ a -2€
- Use freebet: 75-85% del valor
- Generate freebet: Valor freebet - pérdida calificante
- Prepayment: 60-80% del pago anticipado

---

## Recursos Adicionales

### Calculadoras Online

- Verificar cálculos manualmente antes de apostar
- Usar como segunda opinión
- No confiar ciegamente, entender la lógica

### Comunidades

- Foros de matched betting para compartir promociones
- Grupos de Telegram para alertas en tiempo real
- Nunca compartir datos personales de cuentas

### Herramientas Recomendadas

- **OddsMonkey**: Scanner de cuotas
- **Profit Accumulator**: Calendario de promociones
- **BetBurger**: Oportunidades de arbitraje
- **RebelBetting**: Automated betting (avanzado)

### Libros y Guías

- "Matched Betting Guide" - Guía fundamental
- "Beating the Bookies" - Estrategias avanzadas
- "The Definitive Guide to Matched Betting" - Referencia completa

---

## Changelog

### Versión 1.0 (Actual)

- 44 funciones de cálculo implementadas
- Soporte completo para matched betting y dutching
- Implementación de combined bets (2 y 3 líneas)
- Modos Standard, Underlay y Overlay
- Casos unmatched y prepayment
- Documentación completa con ejemplos

### Roadmap Futuro

- [ ] Soporte para 4+ líneas en combinadas
- [ ] Calculadora de cada way betting
- [ ] Integración con APIs de bookmakers
- [ ] Dashboard de tracking automático
- [ ] Machine learning para optimización de strategies
- [ ] Alertas automáticas de promociones

---

**Última actualización**: Octubre 2025  
**Autor**: Sistema de Matched Betting  
**Versión**: 1.0.0
