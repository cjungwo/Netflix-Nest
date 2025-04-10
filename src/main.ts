import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from './common/middleware/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // get only defined parameter
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true, // convert string to number
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
