import { BaseAuthorizationGuard } from '../../shared/guards/base.authorization.guard';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompetitionOrganizerAuthorizationService } from './competition-organizer.authorization.service';
import { Competition } from '../competition.entity';

@Injectable()
export class CompetitionOrganizerAuthorizationGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    private competitionOrganizerAuthorizationService: CompetitionOrganizerAuthorizationService,
  ) {
    super(reflector, Competition.name);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return super.authorize(
      context,
      this.competitionOrganizerAuthorizationService,
      Number(request.params.competitionId),
    );
  }
}
