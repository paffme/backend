import { BaseAuthorizationService } from '../../shared/authorization/base.authorization.service';
import { Injectable } from '@nestjs/common';
import type { User } from '../../user/user.entity';
import { Competition } from '../competition.entity';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { CompetitionRegistration } from '../../shared/entity/competition-registration.entity';

@Injectable()
export class RegistrationAuthorizationService extends BaseAuthorizationService {
  constructor(
    @InjectRepository(CompetitionRegistration)
    private readonly competitionRegistrationRepository: EntityRepository<
      CompetitionRegistration
    >,
  ) {
    super();
  }

  async authorize(
    userId: typeof User.prototype.id,
    competitionId: typeof Competition.prototype.id,
  ): Promise<boolean> {
    // Using query builder, filtering with reference is not yet available in MikroORM
    //  = await this.competitionRegistrationRepository
    //   .createQueryBuilder()
    //   .select('*')
    //   .where({
    //     user: userId,
    //     competition: competitionId,
    //   })
    //   .execute();

    const registration = this.competitionRegistrationRepository.findOne({
      climber: userId,
      competition: competitionId,
    });

    return !!registration;
  }
}
