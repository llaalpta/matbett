import {
  PromotionSchema,
  type Promotion,
  type PromotionEntity,
  type PromotionListInput,
  type PaginatedResponse,
  type AnchorCatalog,
  type AnchorOccurrences,
  type QualifyConditionEntity,
  PromotionStatusSchema,
  BookmakerSchema,
} from '@matbett/shared';
import type { Prisma } from '@prisma/client';
import type { IPromotionService } from '@matbett/api';

import {
  toPromotionCreateInput,
  toPromotionUpdateInput,
  toPromotionEntity,
  generateAnchorCatalog,
  generateAnchorOccurrences,
  toPromotionQualifyConditionEntity,
} from '@/lib/transformers/promotion.transformer';
import { AppError, BadRequestError } from '@/utils/errors';
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
  async create(data: Promotion, userId: string): Promise<PromotionEntity> {
    // 1. Validation
    const validated = PromotionSchema.parse(data);

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
  async update(id: string, data: Promotion): Promise<PromotionEntity> {
    // 1. Verification
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Promotion not found', 404);
    }

    // 2. Partial Validation
    const validated = PromotionSchema.parse(data);
    this.assertNoBlockedHierarchyRemovals(existing, validated);

    // 3. Transformation (Calculates diffs for create, update, delete)
    const updateInput = toPromotionUpdateInput(validated, existing.id);

    // 4. Persistence
    const updated = await this.repository.update(id, updateInput);

    // 5. Return transformed entity
    return toPromotionEntity(updated);
  }

  private assertNoBlockedHierarchyRemovals(
    existing: PromotionWithRelations,
    incoming: Promotion
  ): void {
    const incomingPhaseIds = new Set(
      incoming.phases.map((phase) => phase.id).filter(Boolean)
    );

    const removedPhases = existing.phases.filter(
      (phase) => !incomingPhaseIds.has(phase.id)
    );

    for (const phase of removedPhases) {
      if (phase.rewards.length > 0) {
        throw new BadRequestError(
          `Cannot remove phase "${phase.name}" because it still has rewards. Remove child rewards first.`
        );
      }
    }

    for (const existingPhase of existing.phases) {
      const incomingPhase = incoming.phases.find(
        (phase) => phase.id === existingPhase.id
      );
      if (!incomingPhase) {
        continue;
      }

      const incomingRewardIds = new Set(
        incomingPhase.rewards.map((reward) => reward.id).filter(Boolean)
      );
      const removedRewards = existingPhase.rewards.filter(
        (reward) => !incomingRewardIds.has(reward.id)
      );

      for (const reward of removedRewards) {
        if (reward.qualifyConditions.length > 0) {
          throw new BadRequestError(
            `Cannot remove reward "${reward.id}" because it still has qualify conditions. Remove child qualify conditions first.`
          );
        }
      }
    }

    const incomingConditionIds = new Set<string>();
    for (const condition of incoming.availableQualifyConditions) {
      if (condition.id) {
        incomingConditionIds.add(condition.id);
      }
    }
    for (const phase of incoming.phases) {
      for (const reward of phase.rewards) {
        for (const condition of reward.qualifyConditions) {
          if (condition.id) {
            incomingConditionIds.add(condition.id);
          }
        }
      }
    }

    const removedConditions = existing.availableQualifyConditions.filter(
      (condition) => !incomingConditionIds.has(condition.id)
    );

    for (const condition of removedConditions) {
      const hasUsage = (condition._count.rewards ?? 0) > 0;
      const hasTracking = (condition._count.deposits ?? 0) > 0 || (condition._count.bets ?? 0) > 0;

      if (hasUsage || hasTracking) {
        throw new BadRequestError(
          `Cannot remove qualify condition "${condition.id}" because it still has dependencies.`
        );
      }
    }
  }

  /**
   * Lists promotions with pagination, filtering, and sorting.
   *
   * @param input - Parameters for pagination, filters, and sorting.
   * @returns A paginated response of promotion entities.
   */
  async list(userId: string, input: PromotionListInput): Promise<PaginatedResponse<PromotionEntity>> {
    const { pageIndex, pageSize, status, bookmaker, sorting } = input;

    const where: Prisma.PromotionWhereInput = { userId };
    if (status) {
      const parsedStatus = PromotionStatusSchema.safeParse(status);
      if (parsedStatus.success) {where.status = parsedStatus.data;}
    }
    if (bookmaker) {
      const parsedBookmaker = BookmakerSchema.safeParse(bookmaker);
      if (parsedBookmaker.success) {where.bookmaker = parsedBookmaker.data;}
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

    // No incluir metadata de anchors en el listado (optimizacion de rendimiento)
    const promotionEntities = promotions.map((p: PromotionWithRelations) =>
      toPromotionEntity(p)
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
    if (!promotion) {return null;}
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

  async getAnchorCatalog(promotionId: string): Promise<AnchorCatalog> {
    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }
    return generateAnchorCatalog(promotion);
  }

  async getAnchorOccurrences(promotionId: string): Promise<AnchorOccurrences> {
    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }
    return generateAnchorOccurrences(promotion);
  }

  async getAvailableQualifyConditions(
    promotionId: string
  ): Promise<QualifyConditionEntity[]> {
    const conditions =
      await this.repository.findAvailableQualifyConditionsByPromotionId(
        promotionId
      );

    if (!conditions) {
      throw new AppError('Promotion not found', 404);
    }

    return conditions.map((condition) => toPromotionQualifyConditionEntity(condition));
  }
}
