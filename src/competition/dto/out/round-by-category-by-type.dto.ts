import { CategoryName } from '../../../shared/types/category-name.enum';
import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { Sex } from '../../../shared/types/sex.enum';
import { BoulderingLimitedRoundDto } from '../../../bouldering/dto/out/bouldering-limited-round.dto';
import { CompetitionRoundType } from '../../competition-round-type.enum';

@ApiExtraModels(BoulderingLimitedRoundDto)
class RoundByTypeDto {
  @ApiPropertyOptional()
  readonly [CompetitionRoundType.QUALIFIER]?: BoulderingLimitedRoundDto;

  @ApiPropertyOptional()
  readonly [CompetitionRoundType.SEMI_FINAL]?: BoulderingLimitedRoundDto;

  @ApiPropertyOptional()
  readonly [CompetitionRoundType.FINAL]?: BoulderingLimitedRoundDto;
}

@ApiExtraModels(RoundByTypeDto)
class RoundBySexDto {
  @ApiPropertyOptional()
  readonly [Sex.Female]?: RoundByTypeDto;

  @ApiPropertyOptional()
  readonly [Sex.Male]?: RoundByTypeDto;
}

@ApiExtraModels(RoundBySexDto)
export class RoundByCategoryByTypeDto {
  @ApiPropertyOptional()
  readonly [CategoryName.Microbe]?: RoundBySexDto;

  @ApiPropertyOptional()
  readonly [CategoryName.Poussin]?: RoundBySexDto;

  @ApiPropertyOptional()
  readonly [CategoryName.Benjamin]?: RoundBySexDto;

  @ApiPropertyOptional()
  readonly [CategoryName.Minime]?: RoundBySexDto;

  @ApiPropertyOptional()
  readonly [CategoryName.Cadet]?: RoundBySexDto;

  @ApiPropertyOptional()
  readonly [CategoryName.Junior]?: RoundBySexDto;

  @ApiPropertyOptional()
  readonly [CategoryName.Senior]?: RoundBySexDto;

  @ApiPropertyOptional()
  readonly [CategoryName.Veteran]?: RoundBySexDto;
}
