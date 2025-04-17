import { CacheModule } from '@nestjs/cache-manager';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { envVarKeys } from './common/const/env.const';
import { ForbiddenExceptionFilter } from './common/filter/forbidden.filter';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceptor';
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
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'), // accessable root path
      serveRoot: '/public/', // prefix of serve root
    }),
    CacheModule.register({
      isGlobal: true,
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
    {
      provide: 'APP_GUARD',
      useClass: RBACGuard,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: ResponseTimeInterceptor,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: ThrottleInterceptor,
    },
    {
      provide: 'APP_FILTER',
      useClass: ForbiddenExceptionFilter,
    },
    {
      provide: 'APP_FILTER',
      useClass: QueryFailedExceptionFilter,
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
