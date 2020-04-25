import { BaseEntity } from '../../shared/base.entity';
import { Entity, ManyToOne, Property } from 'mikro-orm';
import { BoulderingGroup } from '../group/bouldering-group.entity';

@Entity()
export class Boulder extends BaseEntity {
  @ManyToOne()
  group: BoulderingGroup;

  @Property()
  index: number;

  constructor(group: BoulderingGroup, index: number) {
    super();
    this.group = group;
    this.index = index;
  }
}
