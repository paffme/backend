import { BaseAuthorizationGuard } from '../../shared/guards/base.authorization.guard';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizerAuthorizationService } from './organizer.authorization.service';
import { Competition } from '../competition.entity';

@Injectable()
export class OrganizerAuthorizationGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    private organizerAuthorizationService: OrganizerAuthorizationService,
  ) {
    super(reflector, Competition.name);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return super.authorize(
      context,
      this.organizerAuthorizationService,
      Number(request.params.competitionId),
    );
  }
}
