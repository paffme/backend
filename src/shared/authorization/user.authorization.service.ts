import { BaseAuthorizationService } from './base.authorization.service';
import type { User } from '../../user/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserAuthorizationService extends BaseAuthorizationService {
  authorize(
    authenticatedUserId: typeof User.prototype.id,
    userId: typeof User.prototype.id,
  ): boolean {
    return authenticatedUserId === userId;
  }
}
