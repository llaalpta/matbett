import {
  PromotionSchema,
  type Promotion,
  type PromotionEntity,
  type PromotionListInput,
  type PaginatedResponse,
  type AvailableTimeframes,
  PromotionStatusSchema,
  BookmakerSchema,
} from '@matbett/shared';
import type { Prisma } from '@prisma/client';
import type { IPromotionService } from '@matbett/api';

import {
  toPromotionCreateInput,
  toPromotionUpdateInput,
  toPromotionEntity,
  generateAvailableTimeframes,
} from '@/lib/transformers/promotion.transformer';
import {
  getAllAnchorEntries,
  findTimeframesReferencingAnchor,
  updateResolvedDates,
} from '@/lib/transformers/timeframe-resolver.transformer';
import { AppError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';
import type { PromotionWithRelations } from '@/repositories/promotion.repository';
import { PromotionRepository } from '@/repositories/promotion.repository';

/**
 * PromotionService
 *
 * Manages the business logic for matched betting promotions.
 * Implements the "Application-Side IDs" strategy for atomic and robust CRUD operations.
 */
export class PromotionService implements IPromotionService {
  private repository: PromotionRepository;

  constructor() {
    this.repository = new PromotionRepository();
  }

  /**
   * Creates a new promotion using an atomic nested write operation.
   *
   * @param data - The promotion data adhering to the shared Promotion schema.
   * @returns The created promotion entity.
   */
  async create(data: Promotion): Promise<PromotionEntity> {
    // --- DIAGNÓSTICO DE FECHA ---
    console.log('🔍 PromotionService.create - Incoming data.timeframe.start:', {
      value: data.timeframe.start,
      type: typeof data.timeframe.start,
      isDateInstance: data.timeframe.start instanceof Date,
    });
    // --- FIN DIAGNÓSTICO ---

    // 1. Validation
    const validated = PromotionSchema.parse(data);

    // TODO: Get real userId from auth context
    const userId = 'temp-user';

    // 2. Transformation (Generates IDs and the entire creation graph)
    const prismaInput = toPromotionCreateInput(validated, userId);

    // 3. Persistence (Single, atomic query)
    const created = await this.repository.create(prismaInput);

    // 4. Return transformed entity
    return toPromotionEntity(created);
  }

  /**
   * Updates an existing promotion using an atomic nested write operation.
   *
   * @param id - The ID of the promotion to update.
   * @param data - The partial data to update.
   * @returns The updated promotion entity.
   */
  async update(id: string, data: Partial<Promotion>): Promise<PromotionEntity> {
    // 1. Verification
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Promotion not found', 404);
    }

    // 2. Partial Validation
    const validated = PromotionSchema.partial().parse(data);

    // 3. Transformation (Calculates diffs for create, update, delete)
    const updateInput = toPromotionUpdateInput(validated);

    // 4. Persistence
    const updated = await this.repository.update(id, updateInput);

    // 5. Return transformed entity
    return toPromotionEntity(updated);
  }

  /**
   * Lists promotions with pagination, filtering, and sorting.
   *
   * @param input - Parameters for pagination, filters, and sorting.
   * @returns A paginated response of promotion entities.
   */
  async list(input: PromotionListInput): Promise<PaginatedResponse<PromotionEntity>> {
    const { pageIndex, pageSize, status, bookmaker, sorting } = input;

    const where: Prisma.PromotionWhereInput = {};
    if (status) {
      const parsedStatus = PromotionStatusSchema.safeParse(status);
      if (parsedStatus.success) where.status = parsedStatus.data;
    }
    if (bookmaker) {
      const parsedBookmaker = BookmakerSchema.safeParse(bookmaker);
      if (parsedBookmaker.success) where.bookmaker = parsedBookmaker.data;
    }

    let orderBy: Prisma.PromotionOrderByWithRelationInput = { createdAt: 'desc' };
    if (sorting && sorting.length > 0 && sorting[0]) {
      const { id, desc } = sorting[0];
      const direction = desc ? 'desc' : 'asc';
      if (['name', 'createdAt', 'updatedAt', 'status'].includes(id)) {
        orderBy = { [id]: direction };
      }
    }

    const [promotions, total] = await prisma.$transaction(async (tx) => {
      const promoPromise = this.repository.findMany({ where, orderBy, skip: pageIndex * pageSize, take: pageSize }, tx);
      const totalPromise = this.repository.count({ where }, tx);
      return Promise.all([promoPromise, totalPromise]);
    });

    // No incluir availableTimeframes en el listado (optimización de rendimiento)
    const promotionEntities = promotions.map((p: PromotionWithRelations) =>
      toPromotionEntity(p, { includeAvailableTimeframes: false })
    );
    const pageCount = Math.ceil(total / pageSize);

    return {
      data: promotionEntities,
      meta: { pageCount, rowCount: total, pageIndex, pageSize },
    };
  }

  /**
   * Gets a single promotion by ID.
   *
   * @param id - The ID of the promotion.
   * @returns The found promotion entity or null.
   */
  async getById(id: string): Promise<PromotionEntity | null> {
    const promotion = await this.repository.findById(id);
    if (!promotion) return null;
    return toPromotionEntity(promotion);
  }

  /**
   * Deletes a promotion.
   *
   * @param id - The ID of the promotion to delete.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Promotion not found', 404);
    }
    await this.repository.delete(id);
  }

  /**
   * Gets available timeframes for a promotion.
   * Used to configure relative timeframes at any level of the hierarchy.
   *
   * @param promotionId - The ID of the promotion.
   * @returns The available timeframes structure.
   */
  async getAvailableTimeframes(promotionId: string): Promise<AvailableTimeframes> {
    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }
    return generateAvailableTimeframes(promotion);
  }

  /**
   * Recalculates resolved dates (start/end) for all relative timeframes in a promotion.
   * Should be called after status changes that set timestamps (e.g., activation, reward received).
   *
   * @param promotionId - The ID of the promotion to recalculate.
   */
  async recalculateTimeframes(promotionId: string): Promise<void> {
    // 1. Fetch full promotion tree
    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }

    // 2. Get all anchor entries (timestamps)
    const anchorEntries = getAllAnchorEntries(promotion);

    // 3. Track which entities need updating
    const phaseUpdates = new Map<string, Prisma.InputJsonValue>();
    const qualifyConditionUpdates = new Map<string, Prisma.InputJsonValue>();
    const rewardUpdates = new Map<string, Prisma.InputJsonValue>();

    // 4. For each anchor with a timestamp, find and update referencing timeframes
    for (const entry of anchorEntries) {
      const referencingTimeframes = findTimeframesReferencingAnchor(
        promotion,
        entry.anchorEntityType,
        entry.anchorEntityId,
        entry.anchorEvent
      );

      for (const ref of referencingTimeframes) {
        const wasModified = updateResolvedDates(ref.timeframe, entry.timestamp);

        if (wasModified) {
          switch (ref.entityType) {
            case 'phase': {
              phaseUpdates.set(ref.entityId, ref.timeframe as unknown as Prisma.InputJsonValue);
              break;
            }
            case 'qualifyCondition': {
              qualifyConditionUpdates.set(ref.entityId, ref.timeframe as unknown as Prisma.InputJsonValue);
              break;
            }
            case 'reward': {
              // For rewards, we need to update the entire usageConditions object
              const reward = promotion.phases
                .flatMap(p => p.rewards)
                .find(r => r.id === ref.entityId);
              if (reward && reward.usageConditions) {
                const uc = reward.usageConditions as Record<string, unknown>;
                uc.timeframe = ref.timeframe;
                rewardUpdates.set(ref.entityId, uc as Prisma.InputJsonValue);
              }
              break;
            }
          }
        }
      }
    }

    // 5. Persist updates in a transaction
    if (phaseUpdates.size > 0 || qualifyConditionUpdates.size > 0 || rewardUpdates.size > 0) {
      await prisma.$transaction(async (tx) => {
        // Update phases
        for (const [phaseId, timeframe] of phaseUpdates) {
          await tx.phase.update({
            where: { id: phaseId },
            data: { timeframe },
          });
        }

        // Update qualify conditions
        for (const [qcId, timeframe] of qualifyConditionUpdates) {
          await tx.rewardQualifyCondition.update({
            where: { id: qcId },
            data: { timeframe },
          });
        }

        // Update rewards (usageConditions)
        for (const [rewardId, usageConditions] of rewardUpdates) {
          await tx.reward.update({
            where: { id: rewardId },
            data: { usageConditions },
          });
        }
      });
    }
  }
}