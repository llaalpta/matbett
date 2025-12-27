/**
 * tRPC Context Implementation
 * Implementa el contexto definido en @matbett/api con servicios inyectados
 */

import { Request, Response } from 'express';

import { prisma } from '@/lib/prisma';
import { DepositService } from '@/services/deposit.service';
import { PromotionService } from '@/services/promotion.service';
import { BookmakerAccountService } from '@/services/bookmaker-account.service';
import { RewardService } from '@/services/reward.service'; // Importar el nuevo servicio

/**
 * Creates context for tRPC requests.
 * Este createContext es llamado una vez por cada solicitud.
 * Aquí inyectamos nuestros servicios y cualquier otra información de la solicitud (ej. usuario autenticado).
 */
export function createContext() {
  // En un entorno real, el userId vendría de la sesión o JWT
  const userId = 'clsm06wts000008ju328l6z1w'; // Hardcodeado para desarrollo

  return {
    prisma,
    userId,
    depositService: new DepositService(),
    promotionService: new PromotionService(),
    bookmakerAccountService: new BookmakerAccountService(),
    rewardService: new RewardService(), // Inyectar el servicio de recompensa
  };
}

export type Context = ReturnType<typeof createContext>;

export type CreateContextOptions = {
  req: Request;
  res: Response;
};
