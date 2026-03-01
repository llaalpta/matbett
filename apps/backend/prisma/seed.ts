import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://matbett_user:matbett_password_dev@localhost:5432/matbett_db',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const devUserId = 'clsm06wts000008ju328l6z1w';

const fixtureIds = {
  bookmakerAccount: 'dev_fixture_reward_tracking_account',
  promotion: 'dev_fixture_reward_tracking_promotion',
  phase: 'dev_fixture_reward_tracking_phase',
  reward: 'dev_fixture_reward_tracking_reward',
  usageTracking: 'dev_fixture_reward_tracking_usage',
  qualifyDeposit: 'dev_fixture_reward_tracking_qc_deposit',
  qualifyBet: 'dev_fixture_reward_tracking_qc_bet',
  deposit: 'dev_fixture_reward_tracking_deposit',
  depositParticipation: 'dev_fixture_reward_tracking_deposit_participation',
  qualifyBatch: 'dev_fixture_reward_tracking_qualify_batch',
  qualifyBetMain: 'dev_fixture_reward_tracking_qualify_bet_main',
  qualifyBetHedge: 'dev_fixture_reward_tracking_qualify_bet_hedge',
  qualifyParticipation: 'dev_fixture_reward_tracking_qualify_participation',
  usageBatch: 'dev_fixture_reward_tracking_usage_batch',
  usageBetMain: 'dev_fixture_reward_tracking_usage_bet_main',
  usageBetHedge: 'dev_fixture_reward_tracking_usage_bet_hedge',
  usageParticipation: 'dev_fixture_reward_tracking_usage_participation',
} as const;

const promotionStart = new Date('2026-05-01T09:00:00.000Z');
const rewardReceivedAt = new Date('2026-05-01T09:05:00.000Z');
const rewardUseStartedAt = new Date('2026-05-01T11:20:00.000Z');
const depositDate = new Date('2026-05-01T09:20:00.000Z');
const qualifyBetPlacedAt = new Date('2026-05-01T10:15:00.000Z');
const qualifyBetSettledAt = new Date('2026-05-01T11:00:00.000Z');
const usageBetPlacedAt = new Date('2026-05-01T11:25:00.000Z');
const usageBetSettledAt = new Date('2026-05-01T12:05:00.000Z');

async function ensureDevUser() {
  const user = await prisma.user.upsert({
    where: { id: devUserId },
    update: {
      email: 'dev@matbett.com',
      name: 'Developer User',
    },
    create: {
      id: devUserId,
      email: 'dev@matbett.com',
      name: 'Developer User',
      hashedPassword: 'password_placeholder',
    },
  });

  console.log(`User ensured: ${user.id}`);
}

async function seedRewardTrackingFixture() {
  await prisma.$transaction(async (tx) => {
    await tx.betParticipation.deleteMany({
      where: {
        id: {
          in: [fixtureIds.qualifyParticipation, fixtureIds.usageParticipation],
        },
      },
    });

    await tx.depositParticipation.deleteMany({
      where: {
        id: fixtureIds.depositParticipation,
      },
    });

    await tx.bet.deleteMany({
      where: {
        id: {
          in: [
            fixtureIds.qualifyBetMain,
            fixtureIds.qualifyBetHedge,
            fixtureIds.usageBetMain,
            fixtureIds.usageBetHedge,
          ],
        },
      },
    });

    await tx.betRegistrationBatch.deleteMany({
      where: {
        id: {
          in: [fixtureIds.qualifyBatch, fixtureIds.usageBatch],
        },
      },
    });

    await tx.deposit.deleteMany({
      where: {
        id: fixtureIds.deposit,
      },
    });

    await tx.rewardUsageTracking.deleteMany({
      where: {
        id: fixtureIds.usageTracking,
      },
    });

    await tx.reward.deleteMany({
      where: {
        id: fixtureIds.reward,
      },
    });

    await tx.rewardQualifyCondition.deleteMany({
      where: {
        id: {
          in: [fixtureIds.qualifyDeposit, fixtureIds.qualifyBet],
        },
      },
    });

    await tx.phase.deleteMany({
      where: {
        id: fixtureIds.phase,
      },
    });

    await tx.promotion.deleteMany({
      where: {
        id: fixtureIds.promotion,
      },
    });

    const bookmakerAccount = await tx.bookmakerAccount.upsert({
      where: {
        id: fixtureIds.bookmakerAccount,
      },
      update: {
        bookmaker: 'Bet365',
        accountType: 'SPORTSBOOK',
        accountIdentifier: 'dev-reward-tracking',
        realBalance: 500,
        bonusBalance: 0,
        freebetBalance: 25,
      },
      create: {
        id: fixtureIds.bookmakerAccount,
        userId: devUserId,
        bookmaker: 'Bet365',
        accountType: 'SPORTSBOOK',
        accountIdentifier: 'dev-reward-tracking',
        realBalance: 500,
        bonusBalance: 0,
        freebetBalance: 25,
      },
    });

    await tx.promotion.create({
      data: {
        id: fixtureIds.promotion,
        userId: devUserId,
        name: 'DEV Reward Tracking Fixture',
        description: 'Fixture para validar rewards con apuestas y depósitos relacionados.',
        bookmaker: bookmakerAccount.bookmaker,
        bookmakerAccountId: bookmakerAccount.id,
        status: 'ACTIVE',
        timeframe: {
          mode: 'ABSOLUTE',
          start: promotionStart.toISOString(),
        },
        cardinality: 'SINGLE',
        activationMethod: 'AUTOMATIC',
        totalBalance: 34,
        activatedAt: promotionStart,
      },
    });

    await tx.phase.create({
      data: {
        id: fixtureIds.phase,
        promotionId: fixtureIds.promotion,
        name: 'Fase 1',
        description: 'Tracking completo de reward',
        status: 'ACTIVE',
        timeframe: {
          mode: 'ABSOLUTE',
          start: promotionStart.toISOString(),
        },
        activationMethod: 'AUTOMATIC',
        totalBalance: 34,
        activatedAt: promotionStart,
      },
    });

    await tx.rewardQualifyCondition.createMany({
      data: [
        {
          id: fixtureIds.qualifyDeposit,
          promotionId: fixtureIds.promotion,
          type: 'DEPOSIT',
          description: 'Depósito qualifying del fixture',
          status: 'FULFILLED',
          priority: 0,
          balance: 0,
          timeframe: {
            mode: 'PROMOTION',
          },
          conditions: {
            depositCode: 'DEV50',
            targetAmount: 60,
            firstDepositOnly: true,
            otherRestrictions: '',
            contributesToRewardValue: false,
          },
          trackingData: {
            type: 'DEPOSIT',
            qualifyingDepositId: fixtureIds.deposit,
            participatingDeposits: [
              {
                depositId: fixtureIds.deposit,
                amount: 60,
                code: 'DEV50',
                depositedAt: depositDate.toISOString(),
              },
            ],
            totalDepositedAmount: 60,
            totalRisk: 0,
            totalProfit: 0,
            balance: 0,
            yield: 0,
          },
          startedAt: promotionStart,
          qualifiedAt: depositDate,
        },
        {
          id: fixtureIds.qualifyBet,
          promotionId: fixtureIds.promotion,
          type: 'BET',
          description: 'Apuesta qualifying del fixture',
          status: 'FULFILLED',
          priority: 1,
          balance: 16,
          timeframe: {
            mode: 'ABSOLUTE',
            start: promotionStart.toISOString(),
          },
          conditions: {
            maxAttempts: 1,
            targetStake: 20,
            allowRetries: false,
            oddsRestriction: {
              minOdds: 1.5,
            },
            allowMultipleBets: false,
            otherRestrictions: '',
            onlyFirstBetCounts: true,
            requiredBetOutcome: 'ANY',
            allowLiveOddsChanges: false,
            multipleBetCondition: {},
            contributesToRewardValue: false,
          },
          trackingData: {
            type: 'BET',
            currentAttempts: 1,
            attemptedBets: [
              {
                betId: fixtureIds.qualifyBetMain,
                batchId: fixtureIds.qualifyBatch,
                stake: 20,
                odds: 1.8,
                profit: 16,
                risk: -20,
                yield: 80,
                status: 'WON',
                legRole: 'MAIN',
                placedAt: qualifyBetPlacedAt.toISOString(),
              },
            ],
            successfulBetId: fixtureIds.qualifyBetMain,
            totalRisk: -20,
            totalProfit: 16,
            balance: 16,
            yield: 80,
          },
          startedAt: promotionStart,
          qualifiedAt: qualifyBetSettledAt,
        },
      ],
    });

    await tx.reward.create({
      data: {
        id: fixtureIds.reward,
        promotionId: fixtureIds.promotion,
        phaseId: fixtureIds.phase,
        type: 'FREEBET',
        value: 50,
        valueType: 'FIXED',
        activationMethod: 'AUTOMATIC',
        claimMethod: 'AUTOMATIC',
        status: 'IN_USE',
        totalBalance: 34,
        receivedAt: rewardReceivedAt,
        useStartedAt: rewardUseStartedAt,
        typeSpecificFields: {
          retentionRate: 75,
          stakeNotReturned: true,
        },
        usageConditions: {
          type: 'FREEBET',
          timeframe: {
            mode: 'ABSOLUTE',
            start: rewardReceivedAt.toISOString(),
          },
          mustUseComplete: false,
          oddsRestriction: {
            minOdds: 1.7,
          },
          stakeRestriction: {},
          allowMultipleBets: true,
          voidConsumesBalance: true,
          allowLiveOddsChanges: false,
          multipleBetCondition: {},
          lockWinningsUntilFullyUsed: false,
        },
        qualifyConditions: {
          connect: [
            { id: fixtureIds.qualifyDeposit },
            { id: fixtureIds.qualifyBet },
          ],
        },
      },
    });

    await tx.rewardUsageTracking.create({
      data: {
        id: fixtureIds.usageTracking,
        rewardId: fixtureIds.reward,
        type: 'FREEBET',
        balance: 18,
        usageData: {
          type: 'FREEBET',
          totalRisk: 0,
          totalProfit: 18,
          balance: 18,
          yield: 72,
          totalUsed: 25,
          remainingBalance: 25,
        },
        startedAt: rewardUseStartedAt,
      },
    });

    await tx.deposit.create({
      data: {
        id: fixtureIds.deposit,
        bookmaker: bookmakerAccount.bookmaker,
        bookmakerAccountId: bookmakerAccount.id,
        amount: 60,
        code: 'DEV50',
        date: depositDate,
        userId: devUserId,
      },
    });

    await tx.depositParticipation.create({
      data: {
        id: fixtureIds.depositParticipation,
        role: 'QUALIFY_TRACKING',
        depositId: fixtureIds.deposit,
        promotionId: fixtureIds.promotion,
        phaseId: fixtureIds.phase,
        rewardId: fixtureIds.reward,
        qualifyConditionId: fixtureIds.qualifyDeposit,
        countsAsQualification: true,
      },
    });

    await tx.betRegistrationBatch.createMany({
      data: [
        {
          id: fixtureIds.qualifyBatch,
          userId: devUserId,
          strategyKind: 'HEDGE',
          strategyType: 'MATCHED_BETTING',
          lineMode: 'SINGLE',
          mode: 'STANDARD',
          hedgeAdjustmentType: null,
          dutchingOptionsCount: null,
          scenarioId: 'SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET',
          calculationParticipationId: null,
          events: [
            {
              eventName: 'Fixture Qualifying Match',
              marketName: 'Ganador del partido',
              eventOptions: 'TWO_OPTIONS',
            },
          ],
          profit: 10.1,
          risk: -9.9,
          yield: 50.5,
        },
        {
          id: fixtureIds.usageBatch,
          userId: devUserId,
          strategyKind: 'HEDGE',
          strategyType: 'MATCHED_BETTING',
          lineMode: 'SINGLE',
          mode: 'STANDARD',
          hedgeAdjustmentType: null,
          dutchingOptionsCount: null,
          scenarioId: 'SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET',
          calculationParticipationId: null,
          events: [
            {
              eventName: 'Fixture Usage Match',
              marketName: 'Ganador del partido',
              eventOptions: 'TWO_OPTIONS',
            },
          ],
          profit: 18,
          risk: 0,
          yield: 72,
        },
      ],
    });

    await tx.bet.createMany({
      data: [
        {
          id: fixtureIds.qualifyBetMain,
          batchId: fixtureIds.qualifyBatch,
          bookmakerAccountId: bookmakerAccount.id,
          legRole: 'MAIN',
          legOrder: 0,
          selections: [{ selection: 'Fixture Team A', eventIndex: 0 }],
          odds: 1.8,
          stake: 20,
          commission: 0,
          enhancedOdds: null,
          status: 'WON',
          profit: 16,
          risk: -20,
          yield: 80,
          userId: devUserId,
          placedAt: qualifyBetPlacedAt,
          settledAt: qualifyBetSettledAt,
        },
        {
          id: fixtureIds.qualifyBetHedge,
          batchId: fixtureIds.qualifyBatch,
          bookmakerAccountId: bookmakerAccount.id,
          legRole: 'HEDGE1',
          legOrder: 1,
          selections: [{ selection: 'En contra de Fixture Team A', eventIndex: 0 }],
          odds: 2,
          stake: 10,
          commission: 2,
          enhancedOdds: null,
          status: 'LOST',
          profit: -10,
          risk: -10,
          yield: -100,
          userId: devUserId,
          placedAt: qualifyBetPlacedAt,
          settledAt: qualifyBetSettledAt,
        },
        {
          id: fixtureIds.usageBetMain,
          batchId: fixtureIds.usageBatch,
          bookmakerAccountId: bookmakerAccount.id,
          legRole: 'MAIN',
          legOrder: 0,
          selections: [{ selection: 'Fixture Team B', eventIndex: 0 }],
          odds: 1.72,
          stake: 25,
          commission: 0,
          enhancedOdds: null,
          status: 'WON',
          profit: 18,
          risk: 0,
          yield: 72,
          userId: devUserId,
          placedAt: usageBetPlacedAt,
          settledAt: usageBetSettledAt,
        },
        {
          id: fixtureIds.usageBetHedge,
          batchId: fixtureIds.usageBatch,
          bookmakerAccountId: bookmakerAccount.id,
          legRole: 'HEDGE1',
          legOrder: 1,
          selections: [{ selection: 'En contra de Fixture Team B', eventIndex: 0 }],
          odds: 2.02,
          stake: 12.3,
          commission: 2,
          enhancedOdds: null,
          status: 'LOST',
          profit: -12.3,
          risk: -12.3,
          yield: -100,
          userId: devUserId,
          placedAt: usageBetPlacedAt,
          settledAt: usageBetSettledAt,
        },
      ],
    });

    await tx.betParticipation.createMany({
      data: [
        {
          id: fixtureIds.qualifyParticipation,
          kind: 'QUALIFY_TRACKING',
          batchId: fixtureIds.qualifyBatch,
          betId: fixtureIds.qualifyBetMain,
          promotionId: fixtureIds.promotion,
          phaseId: fixtureIds.phase,
          rewardId: null,
          rewardIds: [fixtureIds.reward],
          calculationRewardId: fixtureIds.reward,
          rewardType: 'FREEBET',
          qualifyConditionId: fixtureIds.qualifyBet,
          usageTrackingId: null,
          contributesToTracking: true,
          stakeAmount: 20,
          rolloverContribution: null,
        },
        {
          id: fixtureIds.usageParticipation,
          kind: 'REWARD_USAGE',
          batchId: fixtureIds.usageBatch,
          betId: fixtureIds.usageBetMain,
          promotionId: fixtureIds.promotion,
          phaseId: fixtureIds.phase,
          rewardId: fixtureIds.reward,
          rewardIds: [],
          calculationRewardId: null,
          rewardType: 'FREEBET',
          qualifyConditionId: null,
          usageTrackingId: fixtureIds.usageTracking,
          contributesToTracking: true,
          stakeAmount: 25,
          rolloverContribution: null,
        },
      ],
    });

    await tx.betRegistrationBatch.update({
      where: { id: fixtureIds.qualifyBatch },
      data: {
        calculationParticipationId: fixtureIds.qualifyParticipation,
      },
    });

    await tx.betRegistrationBatch.update({
      where: { id: fixtureIds.usageBatch },
      data: {
        calculationParticipationId: fixtureIds.usageParticipation,
      },
    });
  });

  console.log('Reward tracking fixture ensured.');
}

async function main() {
  await ensureDevUser();
  await seedRewardTrackingFixture();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
