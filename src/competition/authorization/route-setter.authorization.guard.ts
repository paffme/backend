import { BaseAuthorizationGuard } from '../../shared/guards/base.authorization.guard';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Competition } from '../competition.entity';
import { RouteSetterAuthorizationService } from './route-setter.authorization.service';

@Injectable()
export class RouteSetterAuthorizationGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    private routeSetterAuthorizationService: RouteSetterAuthorizationService,
  ) {
    super(reflector, Competition.name);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return super.authorize(
      context,
      this.routeSetterAuthorizationService,
      Number(request.params.competitionId),
    );
  }
}
