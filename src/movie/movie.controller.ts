import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { Role } from 'src/user/entities/user.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  @Get()
  // @UseInterceptors(CacheInterceptor)
  getMovies(@Query() dto: GetMoviesDto) {
    return this.movieService.findAll(dto);
  }

  @Public()
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @RBAC(Role.user)
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(
    FileInterceptor('movie', {
      limits: {
        fileSize: 20000000,
      },
      fileFilter(req, file, callback) {
        if (file.mimetype === 'video/mp4') {
          return callback(
            new BadRequestException('Only MP4 file accepted'),
            false,
          );
        }

        return callback(null, true);
      },
    }),
  )
  postMovie(
    @Body() body: CreateMovieDto,
    @Request() req: any,
    @UploadedFile() movie: Express.Multer.File,
  ) {
    return this.movieService.create(body, movie.filename, req.queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
    @Request() req: any,
  ) {
    return this.movieService.update(id, body, req.queryRunner);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }
}
