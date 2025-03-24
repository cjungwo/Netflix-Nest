import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { Director } from './entity/director.entity';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}

  findAll() {
    return this.directorRepository.find();
  }

  findOne(id: number) {
    return this.directorRepository.findOne({
      where: {
        id,
      },
    });
  }

  create(dto: CreateDirectorDto) {
    return this.directorRepository.save(dto);
  }

  async update(id: number, dto: UpdateDirectorDto) {
    const director = await this.directorRepository.findOne({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException('This is not existed id of director.');
    }

    await this.directorRepository.update(
      {
        id,
      },
      {
        ...dto,
      },
    );

    const newDirector = await this.directorRepository.findOne({
      where: {
        id,
      },
    });

    return newDirector;
  }

  async remove(id: number) {
    const director = await this.directorRepository.findOne({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException('This is not existed id of director.');
    }

    await this.directorRepository.delete(id);

    return id;
  }
}
