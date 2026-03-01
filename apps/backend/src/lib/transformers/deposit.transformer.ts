import { Prisma } from '@prisma/client';
import type { Deposit as PrismaDeposit } from '@prisma/client';
import {
  BookmakerAccountTypeSchema,
  DepositEntitySchema,
  DepositParticipationSchema,
  type Deposit,
  type DepositEntity,
} from '@matbett/shared';

type PrismaDepositWithParticipations = Prisma.DepositGetPayload<{
  include: {
    bookmakerAccount: true;
    participations: {
      include: {
        promotion: {
          select: {
            id: true;
            name: true;
          };
        };
        phase: {
          select: {
            id: true;
            name: true;
          };
        };
        reward: {
          select: {
            id: true;
            type: true;
          };
        };
      };
    };
  };
}>;

/**
 * Transforms a Deposit input into Prisma format for creation.
 */
export function toDepositCreateInput(
  deposit: Deposit,
  userId: string = 'temp-user',
  bookmakerAccount?: { id: string; bookmaker: string }
): Prisma.DepositCreateInput {
  return {
    bookmaker: bookmakerAccount?.bookmaker ?? '',
    bookmakerAccount: {
      connect: {
        id: bookmakerAccount?.id ?? deposit.bookmakerAccountId,
      },
    },
    amount: deposit.amount,
    date: deposit.date,
    code: deposit.code,
    user: {
      connect: { id: userId },
    },
  };
}

/**
 * Transforms a partial Deposit input into Prisma format for updates.
 */
export function toDepositUpdateInput(data: Partial<Deposit>): Prisma.DepositUpdateInput {
  const updateInput: Prisma.DepositUpdateInput = {};

  if (data.amount !== undefined) {updateInput.amount = data.amount;}
  if (data.date !== undefined) {updateInput.date = data.date;}
  if (data.code !== undefined) {updateInput.code = data.code;}

  return updateInput;
}

/**
 * Transforma un objeto Deposit de Prisma a una DepositEntity.
 */
export function toDepositEntity(
  deposit: PrismaDeposit | PrismaDepositWithParticipations
): DepositEntity {
  const participations =
    'participations' in deposit
      ? deposit.participations.map((participation) =>
          DepositParticipationSchema.parse({
            ...participation,
            promotionName: participation.promotion.name,
            phaseName: participation.phase?.name ?? undefined,
            rewardType: participation.reward?.type ?? undefined,
          })
        )
      : [];

  // Usar el esquema de Zod para garantizar la estructura completa
  return DepositEntitySchema.parse({
    ...deposit,
    participations,
    bookmakerAccountIdentifier:
      'bookmakerAccount' in deposit ? deposit.bookmakerAccount.accountIdentifier : undefined,
    bookmakerAccountType:
      'bookmakerAccount' in deposit
        ? BookmakerAccountTypeSchema.parse(deposit.bookmakerAccount.accountType)
        : undefined,
    // Asegurarse de que `date` sea un Date, ya que Prisma puede devolverlo como string en algunos setups o tipos
    date: new Date(deposit.date),
  });
}
