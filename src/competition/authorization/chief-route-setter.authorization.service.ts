import { BaseAuthorizationService } from '../../shared/authorization/base.authorization.service';
import { Injectable } from '@nestjs/common';
import type { User } from '../../user/user.entity';
import { Competition } from '../competition.entity';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { CompetitionNotFoundError } from '../errors/competition-not-found.error';
import { isNil } from '../../shared/utils/objects.helper';

@Injectable()
export class ChiefRouteSetterAuthorizationService extends BaseAuthorizationService {
  constructor(
    @InjectRepository(Competition)
    private readonly competitionRepository: EntityRepository<Competition>,
  ) {
    super();
  }

  async authorize(
    authenticatedUserId: typeof User.prototype.id,
    competitionId: typeof Competition.prototype.id,
  ): Promise<boolean> {
    const competition = await this.competitionRepository.findOne(
      competitionId,
      ['chiefRouteSetters'],
    );

    if (isNil(competition)) {
      throw new CompetitionNotFoundError();
    }

    return (
      competition.chiefRouteSetters
        .getItems()
        .findIndex(
          (chiefRouteSetter) => chiefRouteSetter.id === authenticatedUserId,
        ) !== -1
    );
  }
}
