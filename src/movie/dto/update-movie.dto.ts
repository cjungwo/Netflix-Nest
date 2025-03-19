import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateMovieDto { 
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  genre?: string;
}