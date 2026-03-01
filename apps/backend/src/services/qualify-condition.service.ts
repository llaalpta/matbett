import type { IQualifyConditionService } from '@matbett/api';
import {
  QualifyConditionSchema,
  type QualifyCondition,
  type QualifyConditionEntity,
  type QualifyConditionListInput,
  type PaginatedResponse,
} from '@matbett/shared';
import type { Prisma } from '@prisma/client';

import { extractQualifyConditions } from '@/lib/transformers/qualify-condition.transformer';
import { toQualifyConditionEntity } from '@/lib/transformers/reward.transformer';
import { QualifyConditionRepository } from '@/repositories/qualify-condition.repository';
import { toInputJson } from '@/utils/prisma-json';
import { AppError, BadRequestError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';

function mapStatusDate(status: QualifyCondition['status'] | undefined, statusDate: Date | undefined) {
  const dates: {
    startedAt?: Date | null;
    qualifiedAt?: Date | null;
    failedAt?: Date | null;
    expiredAt?: Date | null;
  } = {};

  switch (status) {
    case 'QUALIFYING':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.startedAt = statusDate;
      break;
    case 'FULFILLED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.qualifiedAt = statusDate;
      break;
    case 'FAILED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.failedAt = statusDate;
      break;
    default:
      break;
  }

  return dates;
}

export class QualifyConditionService implements IQualifyConditionService {
  private repository: QualifyConditionRepository;

  constructor() {
    this.repository = new QualifyConditionRepository();
  }

  async list(
    userId: string,
    input: QualifyConditionListInput
  ): Promise<PaginatedResponse<QualifyConditionEntity>> {
    const { pageIndex, pageSize, status, type, promotionId, sorting, globalFilter } = input;

    const where: Prisma.RewardQualifyConditionWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (promotionId) {
      where.promotionId = promotionId;
    }
    if (globalFilter && globalFilter.trim().length > 0) {
      where.description = {
        contains: globalFilter.trim(),
        mode: 'insensitive',
      };
    }

    let orderBy: Prisma.RewardQualifyConditionOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    if (sorting && sorting.length > 0 && sorting[0]) {
      const { id, desc } = sorting[0];
      const direction = desc ? 'desc' : 'asc';
      if (
        id === 'createdAt' ||
        id === 'updatedAt' ||
        id === 'status' ||
        id === 'type' ||
        id === 'description'
      ) {
        orderBy = { [id]: direction };
      }
    }

    const [rows, total] = await prisma.$transaction(async (tx) => {
      const rowsPromise = this.repository.findManyForUser(
        userId,
        {
          where,
          orderBy,
          skip: pageIndex * pageSize,
          take: pageSize,
        },
        tx
      );
      const totalPromise = this.repository.countForUser(userId, where, tx);

      return Promise.all([rowsPromise, totalPromise]);
    });

    const data = rows.map((row) => toQualifyConditionEntity(row));

    return {
      data,
      meta: {
        pageCount: Math.ceil(total / pageSize),
        rowCount: total,
        pageIndex,
        pageSize,
      },
    };
  }

  async getById(id: string, userId: string): Promise<QualifyConditionEntity | null> {
    const condition = await this.repository.findByIdForUser(id, userId);
    if (!condition) {
      return null;
    }
    return toQualifyConditionEntity(condition);
  }

  async update(id: string, data: QualifyCondition, userId: string): Promise<QualifyConditionEntity> {
    const existing = await this.repository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError('Qualify condition not found', 404);
    }

    const validated = QualifyConditionSchema.parse(data);
    const statusDates = mapStatusDate(validated.status, validated.statusDate);

    const updateInput: Prisma.RewardQualifyConditionUpdateInput = {
      type: validated.type,
      description: validated.description ?? null,
      status: validated.status,
      timeframe: toInputJson(validated.timeframe),
      conditions: extractQualifyConditions(validated),
      ...statusDates,
    };

    const updated = await this.repository.update(id, updateInput);
    return toQualifyConditionEntity(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError('Qualify condition not found', 404);
    }

    const hasDirectChildren =
      existing._count.rewards > 0 ||
      existing._count.deposits > 0 ||
      existing._count.bets > 0;

    if (hasDirectChildren) {
      throw new BadRequestError(
        'Cannot delete qualify condition with child entities. Remove children first.'
      );
    }

    await this.repository.delete(id);
  }
}
