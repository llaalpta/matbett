# 📘 Lógica de Negocio: Promociones (CRUD Complejo)

**Estado:** Implementado (v2.0)
**Estrategia:** Application-Side IDs + Nested Writes
**Ubicación:** `apps/backend/src/services/promotion.service.ts`

---

## 1. El Desafío

La entidad **Promoción** es un grafo profundo de objetos interconectados:
`Promotion` → `Phases` → `Rewards` ↔ `QualifyConditions` (Many-to-Many).

El enfoque tradicional (inserciones secuenciales) tiene graves problemas:
* **N+1 Queries:** Requiere decenas de llamadas a la BD.
* **Integridad:** Si falla el paso 5 (conectar rewards), la promoción queda corrupta.
* **Bloqueos:** Mantiene la transacción de BD abierta demasiado tiempo.

## 2. La Solución: Application-Side IDs

Invertimos el control. En lugar de esperar a que la BD asigne IDs, **el Backend genera los IDs (`cuid`) en memoria** antes de enviar nada a la base de datos.

Esto nos permite construir el árbol completo de objetos y relaciones en un solo objeto JSON y enviarlo a Prisma para una **ejecución atómica**.

---

## 3. Flujo de Creación (CREATE)

### Algoritmo (Transformer)

1.  **Input:** Recibe el DTO validado (`PromotionSchema`).
2.  **Deduplicación de Condiciones:**
    * Calcula el Hash (`fast-json-stable-stringify`) de cada `QualifyCondition`.
    * Si dos rewards piden lo mismo (ej. "Depósito 50€"), comparten el mismo Hash.
    * Genera un ID único por Hash y lo guarda en un `Map<Hash, ID>`.
3.  **Construcción del Grafo:**
    * Crea el array de `conditions` usando los IDs generados.
    * Crea el array de `rewards`, y en su campo `connect`, usa los IDs del Mapa.
4.  **Persistencia:**
    * Llama a `prisma.promotion.create({ data: grafoCompleto })`.

### Ejemplo de Payload (Simplificado)

```javascript
// Lo que el Transformer entrega a Prisma
{
  data: {
    name: "Promo Bienvenida",
    phases: {
      create: [{
        // 1. Crear condiciones con IDs explícitos (generados en backend)
        availableQualifyConditions: {
          create: [
            { id: "cuid_cond_1", type: "DEPOSIT", conditions: {...} }
          ]
        },
        // 2. Crear Rewards conectando a esos mismos IDs
        rewards: {
          create: [{
            type: "FREEBET",
            qualifyConditions: {
              connect: [{ id: "cuid_cond_1" }] // ¡Conexión segura!
            }
          }]
        }
      }]
    }
  }
}
```

---

## 4. Flujo de Actualización (UPDATE)

El `UPDATE` es un proceso híbrido que maneja **Creación**, **Edición** y **Borrado** simultáneamente en una sola operación.

### Estrategia de Diffing

1.  **Limpieza (DELETE):**
    * Identifica IDs presentes en la BD pero ausentes en el input.
    * Ejecuta `deleteMany: { id: { notIn: [ids_activos] } }`.
2.  **Mapa Maestro de IDs:**
    * Crea un mapa unificado `Map<Hash | ID, ID>`.
    * Llénalo con los IDs existentes.
    * Para elementos nuevos, genera CUIDs y añádelos al mapa (clave = Hash).
3.  **Reconexión (SET):**
    * Para las relaciones Many-to-Many (`Reward` ↔ `Condition`), usamos `set: [...]`.
    * Esto reemplaza la lista completa de conexiones, manejando automáticamente las desvinculaciones.

---

## 5. Implementación Técnica

### Ubicación de Archivos

* **Transformer:** `apps/backend/src/lib/transformers/promotion.transformer.ts`
    * Contiene toda la lógica de generación de IDs y Hashing.
* **Service:** `apps/backend/src/services/promotion.service.ts`
    * Orquestador simple. Llama al transformer y luego al repositorio.
* **Repository:** `apps/backend/src/repositories/promotion.repository.ts`
    * Ejecuta la query de Prisma.

### Dependencias Clave

* `@paralleldrive/cuid2`: Generación de IDs seguros y ordenables.
* `fast-json-stable-stringify`: Hashing determinista (ignora el orden de las claves JSON).

---

## 6. Seguridad y Validación

### Validación de Tipos (Polimorfismo)
Prisma almacena las condiciones en un campo `Json` genérico. Para asegurar la integridad:

1.  **Escritura:** Zod valida el input antes de entrar al Transformer.
2.  **Lectura:** El Transformer de salida usa un `switch` exhaustivo para parsear el JSON al tipo correcto (`Deposit`, `Bet`, etc.).

```typescript
function extractQualifyConditions(qc) {
  switch (qc.type) {
    case 'DEPOSIT': return qc.conditions as Prisma.InputJsonValue;
    // ...
    default: throw new Error(`Tipo desconocido: ${qc.type}`);
  }
}
```

### Safety Helpers
Para evitar errores de runtime al conectar relaciones:
* Usamos `getConditionIdOrThrow(hash)` en lugar de confiar en `map.get(hash)!`.
* Esto garantiza que si la lógica de hashing falla, el proceso se detiene antes de corromper la BD.