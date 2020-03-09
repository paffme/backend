import {Entity, model, property} from '@loopback/repository';

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

@model()
export class Competition extends Entity {
  @property({
    id: true,
    type: 'Number',
    required: false,
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  type: CompetitionType;

  @property({
    type: 'date',
    required: true,
  })
  startDate: Date;

  @property({
    type: 'date',
    required: true,
  })
  endDate: Date;

  @property({
    type: 'string',
    required: true,
  })
  city: string;

  @property({
    type: 'array',
    itemType: Object,
    required: true,
  })
  categories: Category[];

  constructor(data?: Partial<Competition>) {
    super(data);
  }
}

export interface CompetitionRelations {
  // describe navigational properties here
}

export type CompetitionWithRelations = Competition & CompetitionRelations;
