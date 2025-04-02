import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('Invalid token');
    }

    const [_, token] = basicSplit;

    const decodedToken = Buffer.from(token, 'base64').toString('utf-8');

    const tokenSplit = decodedToken.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('Invalid token');
    }

    const [email, password] = tokenSplit;

    return {
      email,
      password,
    };
  }

  /// rawToken: Basic $token
  async signUp(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user) {
      throw new BadRequestException('User already exists');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>('HASH_ROUNDS')!,
    );

    await this.userRepository.save({
      email,
      hash,
    });

    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }
}
