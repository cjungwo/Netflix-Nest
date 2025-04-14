import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @ArrayNotEmpty()
  @IsArray()
  @IsNumber(
    {},
    {
      each: true,
    },
  )
  @Type(() => Number)
  genreIds: number[];

  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsNotEmpty()
  directorId: number;
}
