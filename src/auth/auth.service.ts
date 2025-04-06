import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { envVarKeys } from 'src/common/const/env.const';
import { Role, User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('Invalid token');
    }

    const [basic, token] = basicSplit;

    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('Invalid token');
    }

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

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('Invalid token');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('Invalid token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefreshToken
            ? envVarKeys.refreshTokenSecret
            : envVarKeys.accessTokenSecret,
        ),
      });

      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('Enter RefreshToken');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Enter AccessToken');
        }
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('Wrong email or password');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('Wrong email or password');
    }

    return user;
  }

  async issuToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVarKeys.refreshTokenSecret,
    );
    const accessTokenSecret = this.configService.get<string>(
      envVarKeys.accessTokenSecret,
    );

    return this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '7d' : '1h',
      },
    );
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

    const hash = bcrypt.hashSync(
      password,
      this.configService.get<number>('HASH_ROUNDS')!,
    );

    await this.userRepository.save({
      email,
      password: hash,
    });

    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async signIn(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issuToken(user, true),
      accessToken: await this.issuToken(user, false),
    };
  }
}
