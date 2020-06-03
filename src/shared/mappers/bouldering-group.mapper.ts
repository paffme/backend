import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingGroup } from '../../bouldering/group/bouldering-group.entity';
import { BoulderingGroupDto } from '../../bouldering/dto/out/bouldering-group.dto';
import { BoulderMapper } from './boulder.mapper';

@Injectable()
export class BoulderingGroupMapper extends BaseMapper<
  BoulderingGroupDto,
  BoulderingGroup
> {
  constructor(boulderMapper: BoulderMapper) {
    super({
      id: 'id',
      name: 'name',
      state: 'state',
      roundId: (group) => group.round.id,
      climbers: (group) => group.climbers.getItems().map((c) => c.id),
      boulders: (group) => boulderMapper.mapArray(group.boulders.getItems()),
    });
  }

  public map(group: BoulderingGroup): BoulderingGroupDto {
    return morphism(this.schema, group);
  }

  public mapArray(groups: BoulderingGroup[]): BoulderingGroupDto[] {
    return groups.map((g) => this.map(g));
  }
}
