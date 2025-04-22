import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Movie Title',
    example: 'Harry Potter',
  })
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
  @ApiProperty({
    description: 'Genre Ids',
    example: [1, 2],
  })
  genreIds: number[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Movie Description',
    example: 'Harry Potter ... ...',
  })
  detail: string;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'Director Id',
    example: 1,
  })
  directorId: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Movie File',
    example: 'abc-abc.mp4',
  })
  movieFileName?: string;
}
