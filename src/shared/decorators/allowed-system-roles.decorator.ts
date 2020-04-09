import { SetMetadata } from '@nestjs/common';
import { SystemRole } from '../../user/user-role.enum';
import { CustomDecorator } from '@nestjs/common/decorators/core/set-metadata.decorator';

export const AllowedSystemRoles = (...roles: SystemRole[]): CustomDecorator =>
  SetMetadata('systemRoles', roles);
