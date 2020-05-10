import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { BoulderingGroup } from './bouldering-group.entity';
import { BoulderingRound } from '../round/bouldering-round.entity';
import { GroupNameConflictError } from '../errors/group-name-conflict.error';

@Injectable()
export class BoulderingGroupService {
  constructor(
    @InjectRepository(BoulderingGroup)
    private readonly boulderingGroupRepository: EntityRepository<
      BoulderingGroup
    >,
  ) {}

  async create(name: string, round: BoulderingRound): Promise<BoulderingGroup> {
    const count = await this.boulderingGroupRepository.count({
      round,
      name,
    });

    if (count > 0) {
      throw new GroupNameConflictError();
    }

    const group = new BoulderingGroup(name, round);
    await this.boulderingGroupRepository.persistAndFlush(group);
    return group;
  }

  delete(group: BoulderingGroup): Promise<void> {
    return this.boulderingGroupRepository.removeAndFlush(group);
  }
}
