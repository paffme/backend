import { BaseAuthorizationGuard } from '../../shared/guards/base.authorization.guard';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Competition } from '../competition.entity';
import { BoulderJudgeAuthorizationService } from './boulder-judge.authorization.service';

@Injectable()
export class BoulderJudgeAuthorizationGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    private boulderJudgeAuthorizationService: BoulderJudgeAuthorizationService,
  ) {
    super(reflector, Competition.name);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return super.authorize(
      context,
      this.boulderJudgeAuthorizationService,
      Number(request.params.boulderId),
    );
  }
}
