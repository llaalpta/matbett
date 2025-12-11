/**
 * tRPC Context Type Definitions
 *
 * Este archivo define SOLO los tipos del contexto.
 * La implementación real (createContext) está en apps/backend/src/server.ts
 *
 * Separamos tipos de implementación para que el frontend pueda importar
 * los tipos sin arrastrar dependencias del backend (Express, Prisma, etc.)
 *
 * NOTA: Usamos tipos Entity inferidos de Zod desde @matbett/shared.
 * Los tipos Entity incluyen campos de BD (id, timestamps) además de los campos del formulario.
 * Esto permite que tRPC infiera correctamente los outputs de los endpoints.
 */

import type {
  BookmakerAccount,
  BookmakerAccountEntity,
  BookmakerAccountListInput,
  Promotion,
  PromotionEntity,
  PromotionListInput,
  PaginatedResponse,
  Deposit,
  DepositEntity,
  DepositListInput,
  Reward,
  RewardEntity,
  AvailableTimeframes,
} from '@matbett/shared';

/**
 * Interface para el servicio de cuentas de bookmaker
 * INPUTS usan tipos base (sin id, timestamps)
 * OUTPUTS usan tipos Entity (con id, timestamps)
 */
export interface IBookmakerAccountService {
  list(userId: string, input: BookmakerAccountListInput): Promise<PaginatedResponse<BookmakerAccountEntity>>;
  getById(id: string): Promise<BookmakerAccountEntity>;
  create(data: BookmakerAccount, userId: string): Promise<BookmakerAccountEntity>;
  update(id: string, data: Partial<BookmakerAccount>): Promise<BookmakerAccountEntity>;
  delete(id: string): Promise<void>;
}

/**
 * Interface para el servicio de promociones
 * INPUTS usan tipos base (sin id, timestamps) o ListInput con paginación
 * OUTPUTS usan tipos Entity (con id, timestamps) o PaginatedResponse
 */
export interface IPromotionService {
  list(input: PromotionListInput): Promise<PaginatedResponse<PromotionEntity>>;
  getById(id: string): Promise<PromotionEntity | null>;
  create(data: Promotion): Promise<PromotionEntity>;
  update(id: string, data: Partial<Promotion>): Promise<PromotionEntity>;
  delete(id: string): Promise<void>;
  getAvailableTimeframes(promotionId: string): Promise<AvailableTimeframes>;
}

/**
 * Interface para el servicio de depósitos
 * INPUTS usan tipos base (sin id, timestamps)
 * OUTPUTS usan tipos Entity (con id, timestamps)
 */
export interface IDepositService {
  list(userId: string, input: DepositListInput): Promise<PaginatedResponse<DepositEntity>>; // Updated
  getById(id: string): Promise<DepositEntity>;
  create(data: Deposit, userId: string): Promise<DepositEntity>;
  update(id: string, data: Partial<Deposit>): Promise<DepositEntity>;
  delete(id: string): Promise<void>;
}

/**
 * Interface para el servicio de recompensas
 * INPUTS usan tipos base (sin id, timestamps)
 * OUTPUTS usan tipos Entity (con id, timestamps)
 */
export interface IRewardService {
  getById(id: string): Promise<RewardEntity | null>;
  create(data: Reward, phaseId: string): Promise<RewardEntity>;
  update(id: string, data: Partial<Reward>): Promise<RewardEntity>;
  delete(id: string): Promise<void>;
}

/**
 * Contexto de tRPC con servicios inyectados
 *
 * Este contexto estará disponible en todos los procedures vía { ctx }
 */
export interface Context {
  userId: string;
  bookmakerAccountService: IBookmakerAccountService;
  promotionService: IPromotionService;
  depositService: IDepositService;
  rewardService: IRewardService; // Añadir el servicio de recompensa
}
