/**
 * tRPC Context Type Definitions
 */

import type {
  AnchorCatalog,
  AnchorOccurrences,
  BookmakerAccount,
  BookmakerAccountEntity,
  BookmakerAccountListInput,
  Deposit,
  DeleteDepositResult,
  DepositEntity,
  DepositListInput,
  PaginatedResponse,
  Promotion,
  PromotionEntity,
  PromotionListInput,
  QualifyCondition,
  QualifyConditionEntity,
  QualifyConditionListInput,
  Reward,
  RewardEntity,
} from '@matbett/shared';

export interface IBookmakerAccountService {
  list(userId: string, input: BookmakerAccountListInput): Promise<PaginatedResponse<BookmakerAccountEntity>>;
  getById(id: string): Promise<BookmakerAccountEntity>;
  create(data: BookmakerAccount, userId: string): Promise<BookmakerAccountEntity>;
  update(id: string, data: Partial<BookmakerAccount>): Promise<BookmakerAccountEntity>;
  delete(id: string): Promise<void>;
}

export interface IPromotionService {
  list(userId: string, input: PromotionListInput): Promise<PaginatedResponse<PromotionEntity>>;
  getById(id: string): Promise<PromotionEntity | null>;
  create(data: Promotion, userId: string): Promise<PromotionEntity>;
  update(id: string, data: Promotion): Promise<PromotionEntity>;
  delete(id: string): Promise<void>;
  getAnchorCatalog(promotionId: string): Promise<AnchorCatalog>;
  getAnchorOccurrences(promotionId: string): Promise<AnchorOccurrences>;
  getAvailableQualifyConditions(promotionId: string): Promise<QualifyConditionEntity[]>;
}

export interface IDepositService {
  list(userId: string, input: DepositListInput): Promise<PaginatedResponse<DepositEntity>>;
  getById(id: string): Promise<DepositEntity>;
  create(data: Deposit, userId: string): Promise<DepositEntity>;
  update(id: string, data: Partial<Deposit>): Promise<DepositEntity>;
  delete(id: string): Promise<DeleteDepositResult>;
}

export interface IRewardService {
  getById(id: string): Promise<RewardEntity | null>;
  update(id: string, data: Reward): Promise<RewardEntity>;
  delete(id: string): Promise<void>;
}

export interface IQualifyConditionService {
  list(userId: string, input: QualifyConditionListInput): Promise<PaginatedResponse<QualifyConditionEntity>>;
  getById(id: string, userId: string): Promise<QualifyConditionEntity | null>;
  update(id: string, data: QualifyCondition, userId: string): Promise<QualifyConditionEntity>;
  delete(id: string, userId: string): Promise<void>;
}

export interface Context {
  userId: string;
  bookmakerAccountService: IBookmakerAccountService;
  promotionService: IPromotionService;
  depositService: IDepositService;
  rewardService: IRewardService;
  qualifyConditionService: IQualifyConditionService;
}
