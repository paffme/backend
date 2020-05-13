import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { BoulderingGroup } from './bouldering-group.entity';
import { BoulderingRound } from '../round/bouldering-round.entity';
import { GroupNameConflictError } from '../errors/group-name-conflict.error';
import { Boulder } from '../boulder/boulder.entity';
import { User } from '../../user/user.entity';
import { BoulderService } from '../boulder/boulder.service';
import { BoulderNotFoundError } from '../errors/boulder-not-found.error';

@Injectable()
export class BoulderingGroupService {
  constructor(
    @InjectRepository(BoulderingGroup)
    private readonly boulderingGroupRepository: EntityRepository<
      BoulderingGroup
    >,
    private readonly boulderService: BoulderService,
  ) {}

  private async getBoulderInGroupOrFail(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
  ): Promise<Boulder> {
    const boulders = await group.boulders.init({
      where: {
        id: boulderId,
      },
    });

    const boulder = boulders.getItems()[0];

    if (!boulder) {
      throw new BoulderNotFoundError();
    }

    return boulder;
  }

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

  async assignJudgeToBoulder(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const boulder = await this.getBoulderInGroupOrFail(group, boulderId);
    await this.boulderService.assignJudge(boulder, judgeId);
  }

  async removeJudgeAssignmentToBoulder(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const boulder = await this.getBoulderInGroupOrFail(group, boulderId);
    await this.boulderService.removeJudgeAssignment(boulder, judgeId);
  }

  async getBoulders(group: BoulderingGroup): Promise<Boulder[]> {
    const collection = await group.boulders.init(['judges']);
    return collection.getItems();
  }
}
