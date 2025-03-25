import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { ILike, In, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entity/movie-detail.entity';
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
  ) {}

  async findAll(title?: string) {
    if (!title) {
      return [
        await this.movieRepository.find({
          relations: ['director', 'genres'],
        }),
        await this.movieRepository.count(),
      ];
    }

    return this.movieRepository.find({
      where: {
        title: ILike(`%${title}%`),
      },
      relations: ['director', 'genres'],
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'director', 'genres'],
    });

    return movie;
  }

  async create(dto: CreateMovieDto) {
    const director = await this.directorRepository.findOne({
      where: {
        id: dto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('This is unexisted ID of Director');
    }

    const genres = await this.genreRepository.find({
      where: {
        id: In(dto.genreIds),
      },
    });

    if (genres.length !== dto.genreIds.length) {
      throw new NotFoundException(
        `This is unexisted IDs of Genre -> ${genres.map((genre) => genre.id).join(',')}`,
      );
    }

    const movie = await this.movieRepository.save({
      title: dto.title,
      detail: {
        detail: dto.detail,
      },
      director,
      genres,
    });

    return movie;
  }

  async update(id: number, dto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('This is unexisted ID of Movie');
    }

    const { detail, directorId, genreIds, ...movieRest } = dto;

    let newDirector;

    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: {
          id: directorId,
        },
      });

      if (!director) {
        throw new NotFoundException('This is unexisted ID of Director');
      }

      newDirector = director;
    }

    let newGenres;

    if (genreIds) {
      const genres = await this.genreRepository.find({
        where: {
          id: In(dto.genreIds),
        },
      });

      if (genres.length !== dto.genreIds.length) {
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

    await this.movieRepository.update({ id }, movieUpdateFields);

    if (detail) {
      await this.movieDetailRepository.update(
        {
          id: movie.detail.id,
        },
        {
          detail,
        },
      );
    }

    const newMovie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'director'],
    });

    newMovie!.genres = newGenres;

    await this.movieRepository.save(newMovie!);

    // return this.movieRepository.preload(newMovie!);
    return this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('This is unexisted Movie ID');
    }

    await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
