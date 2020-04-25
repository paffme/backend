import { BaseAuthorizationGuard } from './base.authorization.guard';

import {
  CanActivate,
  ExecutionContext,
  Inject,
  mixin,
  Type,
} from '@nestjs/common';

interface Constructor<AuthorizationGuard> {
  new (...args: any[]): AuthorizationGuard;
}

// Look to https://github.com/microsoft/TypeScript/issues/5453
// to support variadic generics
export function OrGuard<
  A extends BaseAuthorizationGuard,
  B extends BaseAuthorizationGuard
>(guardA: Constructor<A>, guardB: Constructor<B>): Type<unknown> {
  class OrAuthorizationGuard implements CanActivate {
    constructor(
      @Inject(guardA) private readonly firstGuard: BaseAuthorizationGuard,
      @Inject(guardB) private readonly secondGuard: BaseAuthorizationGuard,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const oks = await Promise.all([
        this.firstGuard.canActivate(context),
        this.secondGuard.canActivate(context),
      ]);

      return oks.some((ok) => ok);
    }
  }

  return mixin(OrAuthorizationGuard);
}
