import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  create(dto: CreateUserDto) {
    return this.userRepository.save(dto);
  }

  findAll() {
    return this.userRepository.find();
  }

  findOne(id: number) {
    const user = this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('This is unexisted Id of user');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('This is unexisted Id of user');
    }

    await this.userRepository.update(id, dto);

    return this.userRepository.findOne({
      where: { id },
    });
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('This is unexisted Id of user');
    }

    await this.userRepository.delete(id);

    return id;
  }
}
