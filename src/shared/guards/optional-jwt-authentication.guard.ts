import { AuthGuard } from '@nestjs/passport';
import { User } from '../../user/user.entity';

export class OptionalJwtAuthenticationGuard extends AuthGuard('jwt') {
  handleRequest<T = User>(err: unknown, user: T): T {
    return user;
  }
}
