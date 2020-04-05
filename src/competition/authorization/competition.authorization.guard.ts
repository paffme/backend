import { BaseAuthorizationGuard } from '../../shared/guards/base.authorization.guard';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompetitionAuthorizationService } from './competition.authorization.service';
import { Competition } from '../competition.entity';

@Injectable()
export class CompetitionAuthorizationGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    private competitionAuthorizationService: CompetitionAuthorizationService,
  ) {
    super(reflector, Competition.name);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return super.authorize(
      context,
      this.competitionAuthorizationService,
      Number(request.params.competitionId),
    );
  }
}
