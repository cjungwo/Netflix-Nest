import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBasicAuth, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from 'src/user/entities/user.entity';
import { AuthService } from './auth.service';
import { Authorization } from './decorator/authorization.decorator';
import { Public } from './decorator/public.decorator';
import { RBAC } from './decorator/rbac.decorator';
import { JWT_STRATEGY } from './strategy/jwt.strategy';
import { LOCAL_STRATEGY } from './strategy/local.strategy';

@Controller('auth')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiBasicAuth()
  @Post('sign-up')
  /// authorization: Basic $token
  signUp(@Authorization() token: string) {
    return this.authService.signUp(token);
  }

  @Public()
  @ApiBasicAuth()
  @Post('sign-in')
  signIn(@Authorization() token: string) {
    return this.authService.signIn(token);
  }

  @RBAC(Role.admin)
  @Post('token/block')
  blockToken(@Body('token') token: string) {
    return this.authService.blockToken(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Authorization() token: string) {
    const payload = await this.authService.parseBearerToken(token, true);

    return {
      accessToken: await this.authService.issuToken(payload, false),
    };
  }

  @UseGuards(LOCAL_STRATEGY)
  @Post('sign-in/passport')
  loginUserPassport(@Request() req) {
    return {
      refreshToken: this.authService.issuToken(req.user, true),
      accessToken: this.authService.issuToken(req.user, false),
    };
  }

  @UseGuards(JWT_STRATEGY)
  @Get('private')
  async private(@Request() req) {
    return req.user;
  }
}
