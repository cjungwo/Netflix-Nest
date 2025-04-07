import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Genre } from './entity/genre.entity';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  findAll() {
    return this.genreRepository.find();
  }

  findOne(id: number) {
    return this.genreRepository.findOneBy({ id });
  }

  async create(dto: CreateGenreDto) {
    const genre = await this.genreRepository.findOneBy({ name: dto.name });

    if (genre) {
      throw new NotFoundException('This is existed Id of Genre');
    }

    return this.genreRepository.save(dto);
  }

  async update(id: number, dto: UpdateGenreDto) {
    const genre = await this.genreRepository.findOneBy({ id });

    if (!genre) {
      throw new NotFoundException('This is unexisted Id of Genre');
    }

    await this.genreRepository.update(
      {
        id,
      },
      {
        ...dto,
      },
    );

    const newGenre = await this.genreRepository.findOneBy({ id });

    return newGenre;
  }

  async remove(id: number) {
    const genre = await this.genreRepository.findOneBy({ id });

    if (!genre) {
      throw new NotFoundException('This is unexisted Id of Genre');
    }

    await this.genreRepository.delete(id);

    return id;
  }
}
