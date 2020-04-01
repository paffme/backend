import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { AppRoles } from '../../app.roles';
import { IQueryInfo } from 'accesscontrol/lib/core';
import { SystemRole } from '../../user/user-role.enum';
import { AccessControl } from 'accesscontrol';
import { Permissions, User } from '../../user/user.entity';
import { Reflector } from '@nestjs/core';
import {
  AUTHORIZATION_METADATA_KEY,
  AuthorizationMetadata,
} from '../decorators/allowed-app-roles.decorator';

export type Grants = {
  [role in AppRoles]?: {
    [resource: string]: {
      [actionPossession: string]: string[];
    };
  };
};

export type ResourcePossession = 'own' | 'any';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private getActionFromHTTPMethod(method: string): string {
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

  private getPermissionKeyFromContext(
    context: ExecutionContext,
  ): keyof Permissions {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    if (!context.constructorRef.name.endsWith('Controller')) {
      throw new Error('Unhandled constructor name');
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return `${context.constructorRef.name
      .slice(0, -10) // remove "Controller"
      .toLowerCase()}s` as keyof Permissions;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Init constants
    const request = context.switchToHttp().getRequest();
    const action = this.getActionFromHTTPMethod(request.method);
    const permissionKey = this.getPermissionKeyFromContext(context);
    const resourceName = permissionKey.slice(0, -1); // remove plurals
    const resourceIdParamKey = `${resourceName}Id`;
    const resourceId = Number(request.params[resourceIdParamKey]);

    // Param not defined
    if (isNaN(resourceId)) {
      return false;
    }

    // Set user roles
    const user: User = request.user;
    let userRoles: AppRoles[] = [AppRoles.ANYONE];

    if (user) {
      if (user.systemRole === SystemRole.Admin) {
        return true;
      }

      userRoles.push(AppRoles.AUTHENTICATED);
    } else {
      userRoles.push(AppRoles.UNAUTHENTICATED);
    }

    let possession: ResourcePossession = 'any';

    if (user.ownedResources[permissionKey].includes(resourceId)) {
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
      const currentResource = (currentRole[resourceName] =
        currentRole[resourceName] ?? {});

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
          resource: resourceName,
        };

        return ac.permission(query).granted;
      });
    }

    return false;
  }
}
