import { User } from '../../../user/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryName } from '../../../shared/types/category-name.enum';
import { Sex } from '../../../shared/types/sex.enum';

class Climber {
  @ApiProperty({
    type: Number,
  })
  id!: typeof User.prototype.id;

  @ApiProperty({
    type: String,
  })
  firstName!: typeof User.prototype.firstName;

  @ApiProperty({
    type: String,
  })
  lastName!: typeof User.prototype.lastName;

  @ApiProperty({
    type: String,
  })
  club!: typeof User.prototype.club;
}

class RankingDto {
  @ApiProperty()
  ranking!: number;

  @ApiProperty()
  climber!: Climber;
}

type RankingsByCategoryNameBySex = {
  [category in CategoryName]?: {
    [sex in Sex]?: RankingDto[];
  };
};

class RankingsBySex {
  @ApiPropertyOptional({ isArray: true, type: RankingDto })
  [Sex.Male]?: RankingDto[];

  @ApiPropertyOptional({ isArray: true, type: RankingDto })
  [Sex.Female]?: RankingDto[];
}

export class RankingsDto implements RankingsByCategoryNameBySex {
  @ApiPropertyOptional()
  benjamin?: RankingsBySex;

  @ApiPropertyOptional()
  cadet?: RankingsBySex;

  @ApiPropertyOptional()
  junior?: RankingsBySex;

  @ApiPropertyOptional()
  microbe?: RankingsBySex;

  @ApiPropertyOptional()
  minime?: RankingsBySex;

  @ApiPropertyOptional()
  poussin?: RankingsBySex;

  @ApiPropertyOptional()
  senior?: RankingsBySex;

  @ApiPropertyOptional()
  veteran?: RankingsBySex;
}
