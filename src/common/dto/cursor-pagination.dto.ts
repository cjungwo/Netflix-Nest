import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'page cursor',
    example: 'eyJ2YWx1ZXMiOnt9LCJvcmRlciI6W119',
  })
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: 'page order',
    example: ['id_DESC'],
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  order: string[] = [];

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: 'taken page',
    example: 5,
  })
  take: number = 5;
}
