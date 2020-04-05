import { BaseAuthorizationService } from '../../shared/authorization/base.authorization.service';
import { Injectable } from '@nestjs/common';
import type { User } from '../../user/user.entity';
import { Competition } from '../competition.entity';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';

@Injectable()
export class CompetitionAuthorizationService extends BaseAuthorizationService {
  constructor(
    @InjectRepository(Competition)
    private readonly competitionRepository: EntityRepository<Competition>,
  ) {
    super();
  }

  async authorize(
    userId: typeof User.prototype.id,
    competitionId: typeof Competition.prototype.id,
  ): Promise<boolean> {
    const competition = await this.competitionRepository.findOne(
      competitionId,
      [
        'registrations',
        'juryPresidents',
        'judges',
        'chiefRouteSetters',
        'routeSetters',
        'technicalDelegates',
      ],
    );

    if (!competition) {
      return false;
    }

    // Note: If more granularity is needed then just create another couple of service/guard
    return (
      competition.registrations
        .getItems()
        .some((registration) => registration.climber.id === userId) ||
      competition.judges.getItems().some((judge) => judge.id === userId) ||
      competition.routeSetters
        .getItems()
        .some((routeSetter) => routeSetter.id === userId) ||
      competition.chiefRouteSetters
        .getItems()
        .some((chiefRouteSetter) => chiefRouteSetter.id === userId) ||
      competition.juryPresidents
        .getItems()
        .some((juryPresident) => juryPresident.id === userId) ||
      competition.technicalDelegates
        .getItems()
        .some((technicalDelegate) => technicalDelegate.id === userId)
    );
  }
}
