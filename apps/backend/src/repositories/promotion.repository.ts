/**
 * Promotion Repository
 *
 * Maneja el acceso a datos de promociones con Prisma.
 * Proporciona metodos CRUD con soporte para paginacion, filtrado y ordenamiento.
 */

import type { Prisma, Promotion } from '@prisma/client';

import { prisma } from '@/lib/prisma';

/**
 * Tipo de retorno completo de findMany con todas las relaciones incluidas
 */
export type PromotionWithRelations = Prisma.PromotionGetPayload<{
  include: {
    availableQualifyConditions: {
      include: {
        _count: {
          select: {
            rewards: true;
            deposits: true;
            bets: true;
          };
        };
      };
    };
    phases: {
      include: {
        rewards: {
          include: {
            qualifyConditions: {
              include: {
                _count: {
                  select: {
                    rewards: true;
                    deposits: true;
                    bets: true;
                  };
                };
              };
            };
            usageTracking: true;
          };
        };
      };
    };
  };
}>;

/**
 * Parametros para findMany
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
  async findAvailableQualifyConditionsByPromotionId(
    promotionId: string
  ): Promise<PromotionWithRelations['availableQualifyConditions'] | null> {
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
      select: {
        availableQualifyConditions: {
          include: {
            _count: {
              select: {
                rewards: true,
                deposits: true,
                bets: true,
              },
            },
          },
        },
      },
    });

    return promotion?.availableQualifyConditions ?? null;
  }

  /**
   * Lista promociones con filtros, ordenamiento y paginacion
   *
   * @param params - Parametros de query (where, orderBy, skip, take)
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
  async findMany(
    params: FindManyParams = {},
    tx?: Prisma.TransactionClient
  ): Promise<PromotionWithRelations[]> {
    const { where, orderBy, skip, take } = params;
    const client = tx ? tx.promotion : prisma.promotion;

    return client.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        availableQualifyConditions: {
          include: {
            _count: {
              select: {
                rewards: true,
                deposits: true,
                bets: true,
              },
            },
          },
        },
        phases: {
          orderBy: { createdAt: 'asc' },
          include: {
            rewards: {
              include: {
                qualifyConditions: {
                  include: {
                    _count: {
                      select: {
                        rewards: true,
                        deposits: true,
                        bets: true,
                      },
                    },
                  },
                },
                usageTracking: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Cuenta el numero total de promociones que coinciden con los filtros
   *
   * @param params - Parametros de filtrado
   * @returns Numero de promociones
   *
   * @example
   * ```typescript
   * const total = await repository.count({
   *   where: { status: 'ACTIVE' }
   * });
   * ```
   */
  async count(
    params: { where?: Prisma.PromotionWhereInput } = {},
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const { where } = params;
    const client = tx ? tx.promotion : prisma.promotion;

    return client.count({ where });
  }

  /**
   * Obtiene una promocion por ID con todas sus relaciones
   *
   * @param id - ID de la promocion
   * @returns Promocion con relaciones o null si no existe
   */
  async findById(id: string): Promise<PromotionWithRelations | null> {
    return prisma.promotion.findUnique({
      where: { id },
      include: {
        availableQualifyConditions: {
          include: {
            _count: {
              select: {
                rewards: true,
                deposits: true,
                bets: true,
              },
            },
          },
        },
        phases: {
          orderBy: { createdAt: 'asc' },
          include: {
            rewards: {
              include: {
                qualifyConditions: {
                  include: {
                    _count: {
                      select: {
                        rewards: true,
                        deposits: true,
                        bets: true,
                      },
                    },
                  },
                },
                usageTracking: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Crea una promocion con sus fases y rewards anidados
   *
   * @param data - Datos de la promocion a crear
   * @returns Promocion creada con todas sus relaciones
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
        availableQualifyConditions: {
          include: {
            _count: {
              select: {
                rewards: true,
                deposits: true,
                bets: true,
              },
            },
          },
        },
        phases: {
          include: {
            rewards: {
              include: {
                qualifyConditions: {
                  include: {
                    _count: {
                      select: {
                        rewards: true,
                        deposits: true,
                        bets: true,
                      },
                    },
                  },
                },
                usageTracking: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Actualiza una promocion existente
   *
   * @param id - ID de la promocion a actualizar
   * @param data - Datos a actualizar
   * @returns Promocion actualizada con relaciones
   */
  async update(id: string, data: Prisma.PromotionUpdateInput): Promise<PromotionWithRelations> {
    return prisma.promotion.update({
      where: { id },
      data,
      include: {
        availableQualifyConditions: {
          include: {
            _count: {
              select: {
                rewards: true,
                deposits: true,
                bets: true,
              },
            },
          },
        },
        phases: {
          include: {
            rewards: {
              include: {
                qualifyConditions: {
                  include: {
                    _count: {
                      select: {
                        rewards: true,
                        deposits: true,
                        bets: true,
                      },
                    },
                  },
                },
                usageTracking: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Elimina una promocion
   *
   * @param id - ID de la promocion a eliminar
   * @returns Promocion eliminada
   */
  async delete(id: string): Promise<Promotion> {
    return prisma.promotion.delete({
      where: { id },
    });
  }
}
