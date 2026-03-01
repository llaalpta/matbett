import { 
  type BookmakerAccountEntity, 
  type BookmakerAccount, 
  BookmakerSchema 
} from '@matbett/shared';
import type { BookmakerAccount as PrismaBookmakerAccount, Prisma } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

/**
 * Transforma una cuenta de bookmaker de Prisma a una entidad de dominio.
 * Realiza validación estricta del enum Bookmaker.
 */
export const toBookmakerAccountEntity = (data: PrismaBookmakerAccount): BookmakerAccountEntity => {
  // Validación estricta: asegura que el string de la BD sea un Bookmaker válido
  const bookmaker = BookmakerSchema.parse(data.bookmaker);

  return {
    id: data.id,
    userId: data.userId,
    bookmaker,
    accountIdentifier: data.accountIdentifier,
    realBalance: data.realBalance,
    bonusBalance: data.bonusBalance,
    freebetBalance: data.freebetBalance,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

/**
 * Transforma una entrada de creación de dominio a un input de creación de Prisma.
 * Genera el ID en el lado de la aplicación.
 */
export const toBookmakerAccountCreateInput = (data: BookmakerAccount, userId: string): Prisma.BookmakerAccountCreateInput => {
  return {
    id: createId(),
    user: { connect: { id: userId } },
    bookmaker: data.bookmaker,
    accountIdentifier: data.accountIdentifier,
    realBalance: data.realBalance,
    bonusBalance: data.bonusBalance,
    freebetBalance: data.freebetBalance,
  };
};

/**
 * Transforma una entrada de actualización de dominio a un input de actualización de Prisma.
 */
export const toBookmakerAccountUpdateInput = (data: Partial<BookmakerAccount>): Prisma.BookmakerAccountUpdateInput => {
  return {
    ...data,
  };
};
