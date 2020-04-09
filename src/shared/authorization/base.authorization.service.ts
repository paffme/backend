import { User } from '../../user/user.entity';

export abstract class BaseAuthorizationService {
  abstract authorize(
    authenticatedUserId: typeof User.prototype.id,
    resourceId: unknown,
  ): boolean | Promise<boolean>;
}
