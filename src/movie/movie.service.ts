import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

export interface Movie {
  id: number;
  title: string;
  genre: string;
}

@Injectable()
export class MovieService {
  private movies: Movie[] = [
    {
      id: 1,
      title: 'Harry Potter',
      genre: "Fantasy",
    },
    {
      id: 2,
      title: 'Harry Potter2',
      genre: "Fantasy",
    },
  ];
  private idCounter = 3;

  getManyMovies(title?: string) {
    if (!title) {
      return this.movies;
    }

    return this.movies.filter(m => m.title.startsWith(title));
  }

  getMovieById(id: number) {
    const movie = this.movies.find((m) => m.id === id);

    if (!movie) {
      throw new NotFoundException('This is unexisted Movie ID');
    }

    return movie;
  }

  createMovie(dto: CreateMovieDto) {
    const newMovie: Movie = {
      id: this.idCounter++,
      ...dto
    };

    this.movies.push(newMovie);

    return newMovie;
  }

  updateMovie(id: number, dto: UpdateMovieDto) {
    const movie = this.movies.find((m) => m.id === +id);

    if (!movie) {
      throw new NotFoundException('This is unexisted Movie ID');
    }

    Object.assign(movie, dto);
    
    return movie;
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex((m) => m.id === +id);

    if (movieIndex === -1) {
      throw new NotFoundException('This is unexisted Movie ID');
    }

    this.movies.splice(movieIndex, 1);
    
    return id;
  }

}
