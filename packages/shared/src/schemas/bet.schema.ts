import { z } from 'zod';
import {
  BookmakerSchema,
  BetStatusSchema,
  HedgeTypeSchema,
  HedgeModeSchema,
  HedgeRoleSchema,
  OptionsSchema,
  RewardQualifyConditionRoleSchema,
} from './enums';

// =============================================
// BETTING SCHEMAS
// =============================================

export const BetEventSchema = z.object({
  event: z.string(),
  market: z.string(),
  options: OptionsSchema,
  selection: z.string(),
});

export const EnhancedOddsSchema = z.object({
  normalOdds: z.number(),
  enhancedOdds: z.number(),
  maxStake: z.number(),
  enhancedProfit: z.number(),
  profitDifference: z.number(),
});

export const HedgeStrategySchema = z.object({
  type: HedgeTypeSchema,
  mode: HedgeModeSchema,
  role: HedgeRoleSchema,
  relatedBets: z.array(
    z.object({
      betId: z.string(),
      role: HedgeRoleSchema,
    })
  ),
});

export const QualifyConditionContextSchema = z.object({
  promotionId: z.string(),
  phaseId: z.string().optional(),
  role: RewardQualifyConditionRoleSchema,
  qualifyConditionId: z.string(),
  generatedRewardIds: z.array(z.string()),
});

export const RewardUseContextSchema = z.object({
  promotionId: z.string(),
  phaseId: z.string().optional(),
  rewardId: z.string(),
  contribution: z
    .object({
      stakeAmount: z.number(),
      rolloverContribution: z.number(),
      progressAfter: z.number(),
    })
    .optional(),
});

export const PromotionContextSchema = z.union([
  QualifyConditionContextSchema,
  RewardUseContextSchema,
]);

export const PromotionContextWithHedgeSchema = z.object({
  context: PromotionContextSchema,
  hedgeStrategy: HedgeStrategySchema.optional(),
});

export const BetSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  bookmaker: BookmakerSchema,
  bookmakerComission: z.number(),
  betEvent: BetEventSchema,
  stake: z.number(),
  odds: z.number(),
  enhancedOdds: EnhancedOddsSchema.optional(),
  risk: z.number(),
  profit: z.number(),
  status: BetStatusSchema,
  date: z.date(),
  promotionContexts: z.array(PromotionContextWithHedgeSchema),
});

// Create context variants (sin IDs que se generan en el servidor)
export const CreateQualifyConditionContextSchema = QualifyConditionContextSchema.omit({ qualifyConditionId: true });
export const CreateRewardUseContextSchema = RewardUseContextSchema.omit({ rewardId: true });
export const CreatePromotionContextSchema = z.union([
  CreateQualifyConditionContextSchema,
  CreateRewardUseContextSchema,
]);
export const CreatePromotionContextWithHedgeSchema = z.object({
  context: CreatePromotionContextSchema,
  hedgeStrategy: HedgeStrategySchema.optional(),
});

// Create/Update schemas
export const BetCreateSchema = BetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  date: true,
}).extend({
  promotionContexts: z.array(CreatePromotionContextWithHedgeSchema).optional(),
});

export const BetUpdateSchema = BetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .extend({
    id: z.string().cuid(),
  });

// List metadata and response
export const BetListMetadataSchema = z.object({
  totalBets: z.number(),
  totalStake: z.number(),
  totalProfit: z.number(),
  profitByStatus: z.record(BetStatusSchema, z.number()),
});

export const BetListResponseSchema = z.object({
  items: z.array(BetSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  stats: BetListMetadataSchema,
});

// =============================================
// INFERRED TYPES
// =============================================

export type BetEvent = z.infer<typeof BetEventSchema>;
export type EnhancedOdds = z.infer<typeof EnhancedOddsSchema>;
export type HedgeStrategy = z.infer<typeof HedgeStrategySchema>;
export type QualifyConditionContext = z.infer<typeof QualifyConditionContextSchema>;
export type RewardUseContext = z.infer<typeof RewardUseContextSchema>;
export type PromotionContext = z.infer<typeof PromotionContextSchema>;
export type PromotionContextWithHedge = z.infer<typeof PromotionContextWithHedgeSchema>;
export type Bet = z.infer<typeof BetSchema>;
export type CreateQualifyConditionContext = z.infer<typeof CreateQualifyConditionContextSchema>;
export type CreateRewardUseContext = z.infer<typeof CreateRewardUseContextSchema>;
export type CreatePromotionContext = z.infer<typeof CreatePromotionContextSchema>;
export type CreatePromotionContextWithHedge = z.infer<typeof CreatePromotionContextWithHedgeSchema>;
export type BetCreate = z.infer<typeof BetCreateSchema>;
export type BetUpdate = z.infer<typeof BetUpdateSchema>;
export type BetListMetadata = z.infer<typeof BetListMetadataSchema>;
export type BetListResponse = z.infer<typeof BetListResponseSchema>;
