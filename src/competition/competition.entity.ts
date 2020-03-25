import { Entity, Property } from 'mikro-orm';
import { BaseEntity } from '../shared/base.entity';

export enum CompetitionType {
  Bouldering = 'bouldering',
  Lead = 'lead',
  Speed = 'speed',
  Combined = 'combined',
}

export enum Sex {
  Male = 'male',
  Female = 'female',
}

export enum CategoryName {
  Microbe = 'microbe',
  Poussin = 'poussin',
  Benjamin = 'benjamin',
  Minime = 'minime',
  Cadet = 'cadet',
  Junior = 'junior',
  Senior = 'senior',
  Veteran = 'veteran',
}

export interface Category {
  sex: Sex;
  name: CategoryName;
}

@Entity()
export class Competition extends BaseEntity<Competition> {
  @Property()
  name: string;

  @Property({
    type: String,
  })
  type: CompetitionType;

  @Property()
  startDate: Date;

  @Property()
  endDate: Date;

  @Property()
  address: string;

  @Property()
  city: string;

  @Property()
  postalCode: string;

  @Property()
  categories: Category[];
}
