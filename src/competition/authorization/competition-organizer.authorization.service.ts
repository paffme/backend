import { BaseAuthorizationService } from '../../shared/authorization/base.authorization.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '../../user/user.entity';
import { Competition } from '../competition.entity';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';

@Injectable()
export class CompetitionOrganizerAuthorizationService extends BaseAuthorizationService {
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
      ['organizers'],
    );

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    return (
      competition.organizers
        .getItems()
        .findIndex((organizer) => organizer.id === authenticatedUserId) !== -1
    );
  }
}
