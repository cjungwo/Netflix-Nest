import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Authorization = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    return req.headers['authorization'];
  },
);
