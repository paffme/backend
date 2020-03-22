import { UserRole } from '../../user/user-role.enum';

export interface JwtPayload {
  email: string;
  roles: UserRole[];
  id: number;
}
