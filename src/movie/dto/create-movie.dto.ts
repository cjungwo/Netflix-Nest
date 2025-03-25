import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsArray()
  @IsNumber(
    {},
    {
      each: true,
    },
  )
  genreIds: number[];

  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsNotEmpty()
  directorId: number;
}
