import { Prisma } from '@prisma/client';
import type { QualifyCondition } from '@matbett/shared';

// Helper para tipos JSON
function toJson(data: object): Prisma.InputJsonValue {
  return data as Prisma.InputJsonValue;
}

/**
 * Extrae y valida el objeto de condiciones anidado según el tipo de QualifyCondition.
 * Esta es la única fuente de verdad para extraer condiciones - usada por promotion y reward transformers
 */
export function extractQualifyConditions(qc: QualifyCondition): Prisma.InputJsonValue {
  switch (qc.type) {
    case 'DEPOSIT': return toJson(qc.conditions);
    case 'BET': return toJson(qc.conditions);
    case 'LOSSES_CASHBACK': return toJson(qc.conditions);
    default:
      // Type-safe error handling for exhaustive checks
      const _exhaustiveCheck: never = qc;
      throw new Error(`[Transformer Error] Qualify Condition Type not handled: ${(_exhaustiveCheck as any).type}`);
  }
}
