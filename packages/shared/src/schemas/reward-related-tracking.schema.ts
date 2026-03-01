import { z } from 'zod';

import { DepositEntitySchema } from './deposit.schema';
import { QualifyConditionTypeSchema } from './enums';
import { BetListItemSchema } from './bet.schema';

export const RewardRelatedTrackingRoleSchema = z.enum(['USAGE', 'QUALIFY_TRACKING']);

export const RewardRelatedBetContextSchema = z.object({
  role: RewardRelatedTrackingRoleSchema,
  qualifyConditionId: z.string().optional(),
  qualifyConditionIndex: z.number().int().positive().optional(),
  qualifyConditionType: QualifyConditionTypeSchema.optional(),
});

export const RewardRelatedBetSchema = z.object({
  bet: BetListItemSchema,
  context: RewardRelatedBetContextSchema,
});

export const RewardRelatedDepositContextSchema = z.object({
  qualifyConditionId: z.string(),
  qualifyConditionIndex: z.number().int().positive(),
  qualifyConditionType: z.literal('DEPOSIT'),
});

export const RewardRelatedDepositSchema = z.object({
  deposit: DepositEntitySchema,
  context: RewardRelatedDepositContextSchema,
});

export const RewardRelatedTrackingSchema = z.object({
  rewardId: z.string(),
  relatedBets: z.array(RewardRelatedBetSchema),
  relatedDeposits: z.array(RewardRelatedDepositSchema),
});

export type RewardRelatedTrackingRole = z.infer<typeof RewardRelatedTrackingRoleSchema>;
export type RewardRelatedBetContext = z.infer<typeof RewardRelatedBetContextSchema>;
export type RewardRelatedBet = z.infer<typeof RewardRelatedBetSchema>;
export type RewardRelatedDepositContext = z.infer<typeof RewardRelatedDepositContextSchema>;
export type RewardRelatedDeposit = z.infer<typeof RewardRelatedDepositSchema>;
export type RewardRelatedTracking = z.infer<typeof RewardRelatedTrackingSchema>;
