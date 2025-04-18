import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { logger } from './common/middleware/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });
  // app.setGlobalPrefix('v1');
  app.enableVersioning({
    type: VersioningType.URI,
    // defaultVersion: '1',
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.use(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // get only defined parameter
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true, // convert types like string to number
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
