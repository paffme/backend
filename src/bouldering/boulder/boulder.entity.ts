import { BaseEntity } from '../../shared/base.entity';
import { Collection, Entity, ManyToMany, ManyToOne, Property } from 'mikro-orm';
import { BoulderingGroup } from '../group/bouldering-group.entity';
import { User } from '../../user/user.entity';

export enum BoundingBoxType {
  START = 'START',
  NORMAL = 'NORMAL',
  ZONE = 'ZONE',
  TOP = 'TOP',
}

export type BoundingBoxCoordinates = [number, number, number, number];

export interface BoundingBox {
  coordinates: BoundingBoxCoordinates;
  type: BoundingBoxType;
}

@Entity()
export class Boulder extends BaseEntity {
  @ManyToOne()
  group: BoulderingGroup;

  @ManyToMany(() => User, (user) => user.judgedBoulders, {
    owner: true,
    pivotTable: 'boulder_to_judges',
  })
  judges = new Collection<User>(this);

  @Property()
  index: number;

  @Property()
  photo?: string;

  @Property()
  boundingBoxes?: BoundingBox[];

  @Property()
  polygones?: [];

  constructor(group: BoulderingGroup, index: number) {
    super();
    this.group = group;
    this.index = index;
  }
}
