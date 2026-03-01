import type { Prisma } from '@prisma/client';
import type { QualifyCondition } from '@matbett/shared';
import { toInputJson } from '@/utils/prisma-json';

/**
 * Extrae el objeto de condiciones segun el tipo de QualifyCondition.
 * Se persiste tal cual llega en `conditions`.
 */
export function extractQualifyConditions(qc: QualifyCondition): Prisma.InputJsonValue {
  switch (qc.type) {
    case 'DEPOSIT':
    case 'BET':
    case 'LOSSES_CASHBACK':
      return toInputJson(qc.conditions);
    default:
      throw new Error('[Transformer Error] Qualify Condition Type not handled');
  }
}
