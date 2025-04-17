import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
import {
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { Role } from 'src/user/entities/user.entity';
import { QueryRunner as QR } from 'typeorm';
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
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  @UseInterceptors(CacheInterceptor)
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId: number) {
    return this.movieService.findAll(dto, userId);
  }

  @Public()
  @Get('recent')
  @UseInterceptors(CI) // url base caching -> /movie/recent (o), /movie/recent?xx=xx (x)
  @CacheKey('getRecentMovies') // key base caching  -> /movie/recent (o), /movie/recent?xx=xx (o)
  @CacheTTL(3000) // ttl set at controller
  getRecentMovies() {
    return this.movieService.findRecent();
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
  postMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() qr: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.create(body, userId, qr);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
    @QueryRunner() qr: QR,
  ) {
    return this.movieService.update(id, body, qr);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }

  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
