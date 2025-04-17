import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Headers,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';
import { RBAC } from './decorator/rbac.decorator';
import { JWT_STRATEGY } from './strategy/jwt.strategy';
import { LOCAL_STRATEGY } from './strategy/local.strategy';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  /// authorization: Basic $token
  signUp(@Headers('authorization') token: string) {
    return this.authService.signUp(token);
  }

  @Public()
  @Post('sign-in')
  signIn(@Headers('authorization') token: string) {
    return this.authService.signIn(token);
  }

  @RBAC()
  @Post('token/block')
  blockToken(@Body('token') token: string) {
    return this.authService.blockToken(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Headers('authorization') token: string) {
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
