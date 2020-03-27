import { SystemRole } from '../../user/user-role.enum';

export interface JwtPayload {
  email: string;
  systemRole: SystemRole;
  id: number;
}
