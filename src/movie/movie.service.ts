import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  getManyMovies(title?: string) {
    if (!title) {
      return this.movieRepository.find();
    }

    return this.movieRepository.find({
      where: {
        // title: Like(`%${title}%`),
        title: ILike(`%${title}%`),
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    return movie;
  }

  async createMovie(dto: CreateMovieDto) {
    const movie = await this.movieRepository.save(dto);

    return movie;
  }

  async updateMovie(id: number, dto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException('This is unexisted Movie ID');
    }

    await this.movieRepository.update({ id }, dto);

    const newMovie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    return newMovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException('This is unexisted Movie ID');
    }

    await this.movieRepository.delete(id);

    return id;
  }
}
