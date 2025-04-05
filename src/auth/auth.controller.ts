import {
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
import { JWT_STRATEGY } from './strategy/jwt.strategy';
import { LOCAL_STRATEGY } from './strategy/local.strategy';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  /// authorization: Basic $token
  signUp(@Headers('authorization') token: string) {
    return this.authService.signUp(token);
  }

  @Post('sign-in')
  signIn(@Headers('authorization') token: string) {
    return this.authService.signIn(token);
  }

  @UseGuards(LOCAL_STRATEGY)
  @Post('login/passport')
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
