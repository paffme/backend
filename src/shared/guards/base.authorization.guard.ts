import { AppRoles } from '../../app.roles';
import { IQueryInfo } from 'accesscontrol/lib/core';
import { SystemRole } from '../../user/user-role.enum';
import { AccessControl } from 'accesscontrol';
import { User } from '../../user/user.entity';
import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext } from '@nestjs/common';

import {
  AUTHORIZATION_METADATA_KEY,
  AuthorizationMetadata,
} from '../decorators/allowed-app-roles.decorator';
import { BaseAuthorizationService } from '../authorization/base.authorization.service';
import { isDefined } from '../utils/objects.helper';

type Grants = {
  [role in AppRoles]?: {
    [resource: string]: {
      [actionPossession: string]: string[];
    };
  };
};

type ResourcePossession = 'own' | 'any';
export type Action = 'create' | 'read' | 'update' | 'delete';

export abstract class BaseAuthorizationGuard implements CanActivate {
  protected constructor(
    private readonly reflector: Reflector,
    private readonly resourceName: string,
  ) {
    this.resourceName = this.resourceName.toLowerCase();
  }

  private getActionFromHTTPMethod(method: string): Action {
    switch (method) {
      case 'POST':
        return 'create';
      case 'GET':
        return 'read';
      case 'PATCH':
      case 'PUT':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        throw new Error('Unhandled HTTP verb');
    }
  }

  async authorize(
    context: ExecutionContext,
    authorizationService: BaseAuthorizationService,
    resourceId?: unknown,
  ): Promise<boolean> {
    // Init constants
    const request = context.switchToHttp().getRequest();
    const action = this.getActionFromHTTPMethod(request.method);

    // Set user roles and resource possession
    const user: User | undefined | false = request.user;
    let userRoles: AppRoles[] = [];

    if (isDefined(user) && typeof user !== 'boolean') {
      if (user.systemRole === SystemRole.Admin) {
        return true;
      }

      userRoles.push(AppRoles.AUTHENTICATED);
    } else {
      userRoles.push(AppRoles.UNAUTHENTICATED);
    }

    let possession: ResourcePossession = 'any';

    if (
      isDefined(resourceId) &&
      isDefined(user) &&
      typeof user !== 'boolean' &&
      (await authorizationService.authorize(user.id, resourceId))
    ) {
      userRoles.push(AppRoles.OWNER);
      possession = 'own';
    }

    // Generate grants object for accesscontrol library
    const appRoles: AuthorizationMetadata = this.reflector.get(
      AUTHORIZATION_METADATA_KEY,
      context.getHandler(),
    );

    const grants = appRoles.reduce<Grants>((g, role) => {
      const currentRole = (g[role] = g[role] ?? {});
      const currentResource = (currentRole[this.resourceName] =
        currentRole[this.resourceName] ?? {});

      currentResource[`${action}:${possession}`] = ['*'];
      return g;
    }, {});

    const ac = new AccessControl(grants);
    const configuredRoles = Object.keys(grants);

    // Remove unused roles
    userRoles = userRoles.filter((r) => configuredRoles.includes(r));

    // Determine if the current user is allowed to continue
    if (userRoles.length > 0) {
      return appRoles.some(() => {
        const query: IQueryInfo = {
          action,
          possession,
          role: userRoles,
          resource: this.resourceName,
        };

        return ac.permission(query).granted;
      });
    }

    return false;
  }

  abstract canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
