import { BaseAuthorizationService } from './base.authorization.service';
import type { User } from '../../user/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserAuthorizationService extends BaseAuthorizationService {
  authorize(
    userId: typeof User.prototype.id,
    userId2: typeof User.prototype.id,
  ): boolean {
    return userId === userId2;
  }
}
