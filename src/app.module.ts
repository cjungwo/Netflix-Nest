import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guard/auth.guard';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { envVarKeys } from './common/const/env.const';
import { DirectorModule } from './director/director.module';
import { GenreModule } from './genre/genre.module';
import { MovieModule } from './movie/movie.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ENV: Joi.string().required(),
        DB_TYPE: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVarKeys.dbType) as 'postgres',
        host: configService.get<string>(envVarKeys.dbHost),
        port: configService.get<number>(envVarKeys.dbPort),
        username: configService.get<string>(envVarKeys.dbUser),
        password: configService.get<string>(envVarKeys.dbPassword),
        database: configService.get<string>(envVarKeys.dbDatabase),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleware)
      .exclude(
        {
          path: 'auth/sign-up',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/sign-in',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
