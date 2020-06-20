import type { User } from '../../user/user.entity';

export interface ClimberRankingInfos {
  id: typeof User.prototype.id;
  firstName: typeof User.prototype.firstName;
  lastName: typeof User.prototype.lastName;
  club: typeof User.prototype.club;
}