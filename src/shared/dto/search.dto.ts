import { IsArray, IsOptional, IsString } from 'class-validator';

export class SearchDto<T> {
  @IsOptional()
  $gte?: T;

  @IsOptional()
  $gt?: T;

  @IsOptional()
  $lte?: T;

  @IsOptional()
  $lt?: T;

  @IsOptional()
  @IsArray()
  $in?: T[];

  @IsOptional()
  @IsArray()
  $nin?: T[];

  @IsOptional()
  $eq?: T;

  @IsOptional()
  $ne?: T;

  @IsOptional()
  $like?: T;

  @IsOptional()
  @IsString()
  $re?: T;
}
