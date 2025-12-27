import { Prisma } from '@prisma/client';
import type { Deposit as PrismaDeposit } from '@prisma/client';
import {
  DepositEntitySchema,
  PromotionContextSchema,
  type Deposit,
  type DepositEntity,
} from '@matbett/shared';

/**
 * Transforms a Deposit input into Prisma format for creation.
 */
export function toDepositCreateInput(
  deposit: Deposit,
  userId: string = 'temp-user'
): Prisma.DepositCreateInput {
  return {
    bookmaker: deposit.bookmaker,
    amount: deposit.amount,
    date: deposit.date,
    code: deposit.code,
    user: {
      connect: { id: userId },
    },
    qualifyCondition: deposit.qualifyConditionId
      ? { connect: { id: deposit.qualifyConditionId } }
      : undefined,
  };
}

/**
 * Transforms a partial Deposit input into Prisma format for updates.
 */
export function toDepositUpdateInput(data: Partial<Deposit>): Prisma.DepositUpdateInput {
  const updateInput: Prisma.DepositUpdateInput = {};

  if (data.bookmaker !== undefined) updateInput.bookmaker = data.bookmaker;
  if (data.amount !== undefined) updateInput.amount = data.amount;
  if (data.date !== undefined) updateInput.date = data.date;
  if (data.code !== undefined) updateInput.code = data.code;
  if (data.qualifyConditionId !== undefined) {
    updateInput.qualifyCondition = data.qualifyConditionId
      ? { connect: { id: data.qualifyConditionId } }
      : { disconnect: true }; // Allow disconnecting from a condition
  }

  return updateInput;
}

/**
 * Transforma un objeto Deposit de Prisma a una DepositEntity.
 * Realiza la validación de los campos JSON usando Zod.
 */
export function toDepositEntity(deposit: PrismaDeposit): DepositEntity {
  // Validar y transformar campos JSON
  const promotionContext = deposit.promotionContext
    ? PromotionContextSchema.parse(deposit.promotionContext)
    : undefined;

  // Usar el esquema de Zod para garantizar la estructura completa
  return DepositEntitySchema.parse({
    ...deposit,
    promotionContext,
    // Asegurarse de que `date` sea un Date, ya que Prisma puede devolverlo como string en algunos setups o tipos
    date: new Date(deposit.date),
  });
}
