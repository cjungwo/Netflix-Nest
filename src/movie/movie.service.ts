import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { rename } from 'fs/promises';
import { join } from 'path';
import { CommonService } from 'src/common/common.service';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entities/user.entity';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entity/movie-detail.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly mulRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title } = dto;

    const qb = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title ILIKE :title', { title: `%${title}%` });
    }

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    let [data, count] = await qb.getManyAndCount();

    if (userId) {
      const movieIds = data.map((movie) => movie.id);

      const likedMovies =
        movieIds.length < 1 ? [] : await this.getLikedMovies(movieIds, userId);

      /**
       * {
       *  movieId: boolean
       * }
       */
      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike,
        }),
        {},
      );

      data = data.map((d) => ({
        ...d,
        likeStatus: d.id in likedMovieMap ? likedMovieMap[d.id] : null,
      }));
    }

    return {
      data,
      nextCursor,
      count,
    };
  }

  getLikedMovies(movieIds: number[], userId: number) {
    return this.mulRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.user', 'user')
      .leftJoinAndSelect('mul.movie', 'movie')
      .where('movie.id In(:...movieIds)', { movieIds })
      .andWhere('user.id = :userId', { userId })
      .getMany();
  }

  async findOne(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('id = :id', { id })
      .getOne();

    if (!movie) {
      throw new NotFoundException('This is unexisted Id of movie');
    }

    return movie;
  }

  async create(dto: CreateMovieDto, userId: number, qr: QueryRunner) {
    const director = await qr.manager.findOne(Director, {
      where: {
        id: dto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('This is unexisted ID of Director');
    }

    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(dto.genreIds),
      },
    });

    if (genres.length !== dto.genreIds.length) {
      throw new NotFoundException(
        `This is unexisted IDs of Genre -> ${genres.map((genre) => genre.id).join(',')}`,
      );
    }

    const movieDetail = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: dto.detail,
      })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;

    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');

    const movie = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: dto.title,
        detail: movieDetailId,
        director,
        creator: {
          id: userId,
        },
        movieFilePath: join(movieFolder, dto.movieFileName),
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    await qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));

    await rename(
      join(process.cwd(), tempFolder, dto.movieFileName),
      join(process.cwd(), movieFolder, dto.movieFileName),
    );

    return await qr.manager.findOne(Movie, {
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async update(id: number, dto: UpdateMovieDto, qr: QueryRunner) {
    const movie = await qr.manager.findOne(Movie, {
      where: {
        id,
      },
      relations: ['detail', 'director', 'genres'],
    });

    if (!movie) {
      throw new NotFoundException('This is unexisted ID of Movie');
    }

    const { detail, directorId, genreIds, ...movieRest } = dto;

    let newDirector;

    if (directorId) {
      const director = await qr.manager.findOneBy(Director, { id: directorId });

      if (!director) {
        throw new NotFoundException('This is unexisted ID of Director');
      }

      newDirector = director;
    }

    let newGenres;

    if (genreIds) {
      const genres = await qr.manager.findBy(Genre, { id: In(genreIds) });

      if (genres.length !== genreIds.length) {
        throw new NotFoundException(
          `This is unexisted IDs of Genre -> ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      newGenres = genres;
    }

    const movieUpdateFields = {
      ...movieRest,
      ...(newDirector && { director: newDirector }),
    };

    await qr.manager
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();

    if (detail) {
      await qr.manager
        .createQueryBuilder()
        .update(MovieDetail)
        .set({
          detail,
        })
        .where('id = :id', { id })
        .execute();
    }

    if (newGenres) {
      await qr.manager
        .createQueryBuilder()
        .relation(Movie, 'genres')
        .of(id)
        .addAndRemove(
          newGenres.map((genre) => genre.id),
          movie.genres.map((genre) => genre.id),
        );
    }

    return await qr.manager.findOne(Movie, {
      where: {
        id,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async remove(id: number) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: {
          id,
        },
        relations: ['detail'],
      });

      if (!movie) {
        throw new NotFoundException('This is unexisted Movie ID');
      }

      await qr.manager
        .createQueryBuilder()
        .delete()
        .where('id = :id', { id })
        .execute();

      await qr.manager.delete(MovieDetail, movie.detail.id);

      qr.commitTransaction();

      return id;
    } catch (err) {
      qr.rollbackTransaction();

      throw err;
    } finally {
      qr.release();
    }
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOneBy({ id: movieId });

    if (!movie) {
      throw new BadRequestException('This is unexisted ID of Movie');
    }

    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new UnauthorizedException('This is unexisted ID of User');
    }

    const likeRecord = await this.mulRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (likeRecord) {
      isLike === likeRecord.isLike
        ? await this.mulRepository.delete({
            movie,
            user,
          })
        : await this.mulRepository.update(
            {
              movie,
              user,
            },
            {
              isLike,
            },
          );
    } else {
      await this.mulRepository.save({
        movie,
        user,
        isLike,
      });
    }

    const result = await this.mulRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    return {
      isLike: result && result.isLike,
    };
  }
}
