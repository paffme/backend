import { BaseAuthorizationGuard } from './base.authorization.guard';

import {
  CanActivate,
  ExecutionContext,
  Inject,
  mixin,
  Optional,
  Type,
} from '@nestjs/common';

interface Constructor<AuthorizationGuard> {
  new (...args: any[]): AuthorizationGuard;
}

// Look to https://github.com/microsoft/TypeScript/issues/5453
// to support variadic generics
export function OrGuard<
  A extends BaseAuthorizationGuard,
  B extends BaseAuthorizationGuard,
  C extends BaseAuthorizationGuard,
  D extends BaseAuthorizationGuard
>(
  guardA: Constructor<A>,
  guardB: Constructor<B>,
  guardC?: Constructor<C>,
  guardD?: Constructor<D>,
): Type<unknown> {
  class OrAuthorizationGuard implements CanActivate {
    private readonly guards: BaseAuthorizationGuard[] = [];

    constructor(
      @Inject(guardA) firstGuard: BaseAuthorizationGuard,
      @Inject(guardB) secondGuard: BaseAuthorizationGuard,
      @Optional() @Inject(guardC) thirdGuard?: BaseAuthorizationGuard,
      @Optional() @Inject(guardD) fourthGuard?: BaseAuthorizationGuard,
    ) {
      this.guards.push(firstGuard, secondGuard);

      if (typeof thirdGuard !== 'undefined') {
        this.guards.push(thirdGuard);
      }

      if (typeof fourthGuard !== 'undefined') {
        this.guards.push(fourthGuard);
      }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const oks = await Promise.all(
        this.guards.map((g) => g.canActivate(context)),
      );

      return oks.some((ok) => ok);
    }
  }

  return mixin(OrAuthorizationGuard);
}
