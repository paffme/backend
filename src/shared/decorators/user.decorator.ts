import { createParamDecorator } from '@nestjs/common';
import { User as UserEntity } from '../../user/user.entity';

export const User = createParamDecorator(
  (data, req): UserEntity => {
    return req.user;
  },
);
