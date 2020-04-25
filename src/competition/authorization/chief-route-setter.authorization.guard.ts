import { BaseAuthorizationGuard } from '../../shared/guards/base.authorization.guard';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Competition } from '../competition.entity';
import { ChiefRouteSetterAuthorizationService } from './chief-route-setter.authorization.service';

@Injectable()
export class ChiefRouteSetterAuthorizationGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    private chiefRouteSetterAuthorizationService: ChiefRouteSetterAuthorizationService,
  ) {
    super(reflector, Competition.name);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return super.authorize(
      context,
      this.chiefRouteSetterAuthorizationService,
      Number(request.params.competitionId),
    );
  }
}
