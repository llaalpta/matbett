/**
 * tRPC Context Type Definitions
 */

import type {
  AnchorCatalog,
  AnchorOccurrences,
  AvailablePromotionContexts,
  BookmakerAccount,
  BookmakerAccountEntity,
  BookmakerAccountListInput,
  BetBatchListInput,
  BetBatchSummary,
  BetDashboardTotals,
  BetListInput,
  BetListItem,
  CreateRewardInput,
  BetRegistrationBatch,
  Deposit,
  DeleteBetBatchResult,
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
  RegisterBetsBatch,
  Reward,
  RewardEntity,
  RewardListInput,
  RewardRelatedTracking,
  UpdateBetsBatch,
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
  list(userId: string, input: RewardListInput): Promise<PaginatedResponse<RewardEntity>>;
  getById(id: string): Promise<RewardEntity | null>;
  getRelatedTracking(userId: string, id: string): Promise<RewardRelatedTracking>;
  create(userId: string, input: CreateRewardInput): Promise<RewardEntity>;
  update(id: string, data: Reward): Promise<RewardEntity>;
  delete(id: string): Promise<void>;
}

export interface IQualifyConditionService {
  list(userId: string, input: QualifyConditionListInput): Promise<PaginatedResponse<QualifyConditionEntity>>;
  getById(id: string, userId: string): Promise<QualifyConditionEntity | null>;
  createForReward(userId: string, rewardId: string, data: QualifyCondition): Promise<QualifyConditionEntity>;
  update(id: string, data: QualifyCondition, userId: string): Promise<QualifyConditionEntity>;
  delete(id: string, userId: string): Promise<void>;
}

export interface IBetService {
  registerBetsBatch(userId: string, input: RegisterBetsBatch): Promise<BetRegistrationBatch>;
  updateBatch(userId: string, batchId: string, input: UpdateBetsBatch): Promise<BetRegistrationBatch>;
  deleteBatch(userId: string, batchId: string): Promise<DeleteBetBatchResult>;
  getBatch(userId: string, batchId: string): Promise<BetRegistrationBatch | null>;
  listBatches(userId: string, input: BetBatchListInput): Promise<PaginatedResponse<BetBatchSummary>>;
  listBets(userId: string, input: BetListInput): Promise<PaginatedResponse<BetListItem>>;
  listBetsByPromotion(
    userId: string,
    promotionId: string,
    input: BetListInput,
  ): Promise<PaginatedResponse<BetListItem>>;
  listBetsByQualifyCondition(
    userId: string,
    qualifyConditionId: string,
    input: BetListInput,
  ): Promise<PaginatedResponse<BetListItem>>;
  listBetsByUsageTracking(
    userId: string,
    usageTrackingId: string,
    input: BetListInput,
  ): Promise<PaginatedResponse<BetListItem>>;
  getAvailablePromotionContexts(
    userId: string,
    bookmakerAccountId: string,
  ): Promise<AvailablePromotionContexts>;
  getDashboardTotals(userId: string): Promise<BetDashboardTotals>;
}

export interface Context {
  userId: string;
  bookmakerAccountService: IBookmakerAccountService;
  promotionService: IPromotionService;
  depositService: IDepositService;
  rewardService: IRewardService;
  qualifyConditionService: IQualifyConditionService;
  betService: IBetService;
}
