import { SetMetadata } from '@nestjs/common';
import { SystemRole } from '../../user/user-role.enum';

export const AllowedSystemRoles = (...roles: SystemRole[]) =>
  SetMetadata('systemRoles', roles);
