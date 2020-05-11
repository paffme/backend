import { CategoryName } from '../../../shared/types/category-name.enum';
import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { Sex } from '../../../shared/types/sex.enum';
import { BoulderingLimitedRoundDto } from '../../../bouldering/dto/out/bouldering-limited-round.dto';

@ApiExtraModels(BoulderingLimitedRoundDto)
class RoundBySexDto {
  @ApiPropertyOptional()
  readonly [Sex.Female]?: BoulderingLimitedRoundDto;

  @ApiPropertyOptional()
  readonly [Sex.Male]?: BoulderingLimitedRoundDto;
}

// For documentation purposes only
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
