import { BaseAuthorizationGuard } from '../../shared/guards/base.authorization.guard';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Competition } from '../competition.entity';
import { JuryPresidentAuthorizationService } from './jury-president.authorization.service';

@Injectable()
export class JuryPresidentAuthorizationGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    private juryPresidentAuthorizationService: JuryPresidentAuthorizationService,
  ) {
    super(reflector, Competition.name);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return super.authorize(
      context,
      this.juryPresidentAuthorizationService,
      Number(request.params.competitionId),
    );
  }
}
