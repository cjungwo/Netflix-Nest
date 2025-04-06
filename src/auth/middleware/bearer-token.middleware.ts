import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { envVarKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    try {
      const token = this.validateBearerToken(authHeader);

      const decodedPayload = this.jwtService.decode(token);

      if (
        decodedPayload.type !== 'access' &&
        decodedPayload.type !== 'refresh'
      ) {
        throw new UnauthorizedException('Invalid token');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          decodedPayload.type === 'refresh'
            ? envVarKeys.refreshTokenSecret
            : envVarKeys.accessTokenSecret,
        ),
      });

      req.user = payload;
      next();
    } catch (error) {
      next();
    }
  }

  validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('Invalid token');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('Invalid token');
    }

    return token;
  }
}
