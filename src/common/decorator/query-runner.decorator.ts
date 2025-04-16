import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const QueryRunner = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    if (!req || !req.queryRunner) {
      throw new InternalServerErrorException('Cannot find Query Runner.');
    }

    return req.queryRunner;
  },
);
