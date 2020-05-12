import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  OneToMany,
  Property,
  Unique,
} from 'mikro-orm';

import { SystemRole } from './user-role.enum';
import { BaseEntity } from '../shared/base.entity';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { Competition } from '../competition/competition.entity';
import { CategoryName } from '../shared/types/category-name.enum';
import { Sex } from '../shared/types/sex.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { Category } from '../shared/types/category.interface';
import { Boulder } from '../bouldering/boulder/boulder.entity';

@Entity()
export class User extends BaseEntity {
  @Property({ hidden: true })
  @Unique()
  email: string;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @Property()
  birthYear: number;

  @Enum(() => Sex)
  sex: Sex;

  @Property()
  club: string;

  @Enum(() => SystemRole)
  systemRole: SystemRole = SystemRole.User;

  @Property({ hidden: true, length: 512 })
  password: string;

  @OneToMany(() => CompetitionRegistration, (item) => item.climber)
  registrations: Collection<CompetitionRegistration> = new Collection<
    CompetitionRegistration
  >(this);

  @ManyToMany(() => Competition, (competition) => competition.juryPresidents)
  juryPresidencies: Collection<Competition> = new Collection<Competition>(this);

  @ManyToMany(() => Competition, (competition) => competition.judges)
  judgements: Collection<Competition> = new Collection<Competition>(this);

  @ManyToMany(() => Competition, (competition) => competition.chiefRouteSetters)
  chiefRouteSettings: Collection<Competition> = new Collection<Competition>(
    this,
  );

  @ManyToMany(() => Competition, (competition) => competition.routeSetters)
  routeSettings: Collection<Competition> = new Collection<Competition>(this);

  @ManyToMany(
    () => Competition,
    (competition) => competition.technicalDelegates,
  )
  technicalDelegations: Collection<Competition> = new Collection<Competition>(
    this,
  );

  @ManyToMany(() => Competition, (competition) => competition.organizers)
  organizations: Collection<Competition> = new Collection<Competition>(this);

  @ManyToMany(() => Boulder, (boulder) => boulder.judges)
  boulders: Collection<Boulder> = new Collection<Boulder>(this);

  getCategory(season: number): Category {
    const delta = season - this.birthYear;
    let categoryName: CategoryName;

    if (delta >= 40) {
      categoryName = CategoryName.Veteran;
    } else if (delta >= 19) {
      categoryName = CategoryName.Senior;
    } else if (delta >= 17) {
      categoryName = CategoryName.Junior;
    } else if (delta >= 15) {
      categoryName = CategoryName.Cadet;
    } else if (delta >= 13) {
      categoryName = CategoryName.Minime;
    } else if (delta >= 11) {
      categoryName = CategoryName.Benjamin;
    } else if (delta >= 9) {
      categoryName = CategoryName.Poussin;
    } else if (delta >= 7) {
      categoryName = CategoryName.Microbe;
    } else {
      throw new InternalServerErrorException('Unhandled category');
    }

    return {
      name: categoryName,
      sex: this.sex,
    };
  }

  constructor(
    firstName: string,
    lastName: string,
    birthYear: number,
    sex: Sex,
    email: string,
    password: string,
    club: string,
  ) {
    super();
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthYear = birthYear;
    this.sex = sex;
    this.email = email.trim();
    this.password = password;
    this.club = club;
  }
}

export type UserRelation =
  | 'registrations'
  | 'juryPresidencies'
  | 'judgements'
  | 'chiefRouteSettings'
  | 'routeSettings'
  | 'technicalDelegations'
  | 'organizations';

// This is just for static validation
type CompetitionRelationValidation = Pick<User, UserRelation>;
