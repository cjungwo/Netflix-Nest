import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    if (!req || !req.user || !req.user.sub) {
      throw new UnauthorizedException('Cannot find user info');
    }

    return req.user.sub;
  },
);
