import {
  RewardSchema,
  type Reward,
  type RewardEntity,
} from '@matbett/shared';
import type { IRewardService } from '@matbett/api';
import { AppError } from '@/utils/errors';
import { RewardRepository } from '@/repositories/reward.repository';
import { toRewardCreateInput, toRewardUpdateInput, toRewardEntity } from '@/lib/transformers/reward.transformer';

export class RewardService implements IRewardService {
  private repository: RewardRepository;

  constructor() {
    this.repository = new RewardRepository();
  }

  async getById(id: string): Promise<RewardEntity | null> {
    const reward = await this.repository.findById(id);
    if (!reward) return null;
    return toRewardEntity(reward);
  }

  async create(data: Reward, phaseId: string): Promise<RewardEntity> {
    // La creación de un Reward standalone es rara y compleja, ya que siempre está asociada a una Phase.
    // Para simplificar, asumiremos que si se llama a este método, la Phase se manejará externamente
    // o que este create es un placeholder para casos de uso específicos.
    // Un Reward no puede existir sin una Phase padre.

    const validated = RewardSchema.parse(data);
    const prismaInput = toRewardCreateInput(validated, phaseId);
    const created = await this.repository.create(prismaInput);
    return toRewardEntity(created);
  }

  async update(id: string, data: Partial<Reward>): Promise<RewardEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Reward not found', 404);
    }

    // Note: RewardSchema is a discriminated union, partial() doesn't work directly
    // We need to accept the partial data as-is since it's already validated by tRPC
    const prismaInput = toRewardUpdateInput(data);
    const updated = await this.repository.update(id, prismaInput);
    return toRewardEntity(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Reward not found', 404);
    }
    await this.repository.delete(id);
  }
}
