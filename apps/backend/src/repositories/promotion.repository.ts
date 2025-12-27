/**
 * Promotion Repository
 *
 * Maneja el acceso a datos de promociones con Prisma.
 * Proporciona métodos CRUD con soporte para paginación, filtrado y ordenamiento.
 */

import type { Prisma, Promotion } from '@prisma/client';

import { prisma } from '@/lib/prisma';

/**
 * Tipo de retorno completo de findMany con todas las relaciones incluidas
 */
export type PromotionWithRelations = Prisma.PromotionGetPayload<{
  include: {
    phases: {
      include: {
        availableQualifyConditions: true;
        rewards: {
          include: {
            qualifyConditions: true;
            usageTracking: true;
          };
        };
      };
    };
  };
}>;

/**
 * Parámetros para findMany
 */
export interface FindManyParams {
  where?: Prisma.PromotionWhereInput;
  orderBy?: Prisma.PromotionOrderByWithRelationInput;
  skip?: number;
  take?: number;
}

/**
 * PromotionRepository
 *
 * Repositorio para operaciones de base de datos de promociones.
 * Abstrae las queries de Prisma y proporciona una interfaz limpia para el servicio.
 */
export class PromotionRepository {
  /**
   * Lista promociones con filtros, ordenamiento y paginación
   *
   * @param params - Parámetros de query (where, orderBy, skip, take)
   * @returns Array de promociones con todas sus relaciones
   *
   * @example
   * ```typescript
   * const promotions = await repository.findMany({
   *   where: { status: 'ACTIVE' },
   *   orderBy: { createdAt: 'desc' },
   *   skip: 0,
   *   take: 20
   * });
   * ```
   */
  async findMany(params: FindManyParams = {}, tx?: Prisma.TransactionClient): Promise<PromotionWithRelations[]> {
    const { where, orderBy, skip, take } = params;
    const client = tx ? tx.promotion : prisma.promotion; // Use transaction client if provided

    return client.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        phases: {
          orderBy: { createdAt: 'asc' },
          include: {
            availableQualifyConditions: true,
            rewards: {
              include: {
                qualifyConditions: true,
                usageTracking: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Cuenta el número total de promociones que coinciden con los filtros
   *
   * @param params - Parámetros de filtrado
   * @returns Número de promociones
   *
   * @example
   * ```typescript
   * const total = await repository.count({
   *   where: { status: 'ACTIVE' }
   * });
   * ```
   */
  async count(params: { where?: Prisma.PromotionWhereInput } = {}, tx?: Prisma.TransactionClient): Promise<number> {
    const { where } = params;
    const client = tx ? tx.promotion : prisma.promotion; // Use transaction client if provided

    return client.count({ where });
  }

  /**
   * Obtiene una promoción por ID con todas sus relaciones
   *
   * @param id - ID de la promoción
   * @returns Promoción con relaciones o null si no existe
   */
  async findById(id: string): Promise<PromotionWithRelations | null> {
    return prisma.promotion.findUnique({
      where: { id },
      include: {
        phases: {
          orderBy: { createdAt: 'asc' },
          include: {
            availableQualifyConditions: true,
            rewards: {
              include: {
                qualifyConditions: true,
                usageTracking: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Crea una promoción con sus fases y rewards anidados
   *
   * @param data - Datos de la promoción a crear
   * @returns Promoción creada con todas sus relaciones
   *
   * @example
   * ```typescript
   * const promotion = await repository.create({
   *   name: 'Bono de Bienvenida',
   *   status: 'DRAFT',
   *   phases: {
   *     create: [{ ... }]
   *   }
   * });
   * ```
   */
  async create(data: Prisma.PromotionCreateInput): Promise<PromotionWithRelations> {
    return prisma.promotion.create({
      data,
      include: {
        phases: {
          include: {
            availableQualifyConditions: true,
            rewards: {
              include: {
                qualifyConditions: true,
                usageTracking: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Actualiza una promoción existente
   *
   * @param id - ID de la promoción a actualizar
   * @param data - Datos a actualizar
   * @returns Promoción actualizada con relaciones
   */
  async update(id: string, data: Prisma.PromotionUpdateInput): Promise<PromotionWithRelations> {
    return prisma.promotion.update({
      where: { id },
      data,
      include: {
        phases: {
          include: {
            availableQualifyConditions: true,
            rewards: {
              include: {
                qualifyConditions: true,
                usageTracking: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Elimina una promoción
   *
   * @param id - ID de la promoción a eliminar
   * @returns Promoción eliminada
   */
  async delete(id: string): Promise<Promotion> {
    return prisma.promotion.delete({
      where: { id },
    });
  }
}
