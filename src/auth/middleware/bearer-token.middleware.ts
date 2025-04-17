import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { NextFunction, Request, Response } from 'express';
import { envVarKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    const blockedToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);

    if (blockedToken) {
      throw new UnauthorizedException('This token is blocked.');
    }

    const tokenKey = `TOKEN_${token}`;

    const cachedPayload = await this.cacheManager.get(tokenKey);

    if (cachedPayload) {
      req.user = cachedPayload;

      return next();
    }

    const decodedPayload = this.jwtService.decode(token);

    if (decodedPayload.type !== 'access' && decodedPayload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token');
    }

    try {
      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVarKeys.refreshTokenSecret
          : envVarKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      /// payload['exp'] -> epoch time seconds
      const expiryDate = +new Date(payload['exp'] * 1000);
      const now = +Date.now();

      const diffInSeconds = (expiryDate - now) / 1000;

      await this.cacheManager.set(
        tokenKey,
        payload,
        Math.max((diffInSeconds - 30) * 1000, 1), // ttl set up is very important!!
      );

      req.user = payload;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }

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
