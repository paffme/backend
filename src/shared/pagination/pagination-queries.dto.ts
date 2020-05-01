import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const DEFAULT_PAGE = 1;
export const PAGE = 'page';

export const DEFAULT_PER_PAGE = 30;
export const PER_PAGE = 'perPage';

export class PaginationQueriesDto {
  @ApiPropertyOptional({
    default: DEFAULT_PAGE,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly [PAGE]: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: DEFAULT_PER_PAGE,
    minimum: 1,
    maximum: DEFAULT_PER_PAGE,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DEFAULT_PER_PAGE)
  readonly [PER_PAGE]: number = DEFAULT_PER_PAGE;
}
