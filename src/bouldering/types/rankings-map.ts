import { User } from '../../user/user.entity';

export type RankingsMap = Map<typeof User.prototype.id, number>;
