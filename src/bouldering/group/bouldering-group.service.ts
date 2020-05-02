import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { BoulderingGroup } from './bouldering-group.entity';
import { BoulderingRound } from '../round/bouldering-round.entity';

@Injectable()
export class BoulderingGroupService {
  constructor(
    @InjectRepository(BoulderingGroup)
    private readonly boulderingGroupRepository: EntityRepository<
      BoulderingGroup
    >,
  ) {}

  async create(name: string, round: BoulderingRound): Promise<BoulderingGroup> {
    const group = new BoulderingGroup(name, round);
    await this.boulderingGroupRepository.persistAndFlush(group);
    return group;
  }
}
