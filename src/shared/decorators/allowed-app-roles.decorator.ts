import { SetMetadata } from '@nestjs/common';
import { CustomDecorator } from '@nestjs/common/decorators/core/set-metadata.decorator';
import { AppRoles } from '../../app.roles';

export const AUTHORIZATION_METADATA_KEY = 'authorization';
export type AuthorizationMetadata = AppRoles[];

export const AllowedAppRoles = (...roles: AppRoles[]): CustomDecorator =>
  SetMetadata<string, AuthorizationMetadata>(AUTHORIZATION_METADATA_KEY, roles);
