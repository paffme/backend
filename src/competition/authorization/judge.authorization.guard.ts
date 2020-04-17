import { BaseAuthorizationGuard } from '../../shared/guards/base.authorization.guard';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Competition } from '../competition.entity';
import { JudgeAuthorizationService } from './judge.authorization.service';

@Injectable()
export class JudgeAuthorizationGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    private judgeAuthorizationService: JudgeAuthorizationService,
  ) {
    super(reflector, Competition.name);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return super.authorize(
      context,
      this.judgeAuthorizationService,
      Number(request.params.competitionId),
    );
  }
}
