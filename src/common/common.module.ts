import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { join } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { v4 } from 'uuid';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        /// why use join?
        /// process.cwd() + '/public/movie' -> mac, linux
        /// process.cwd() + '\public\movie' -> windows
        /// => join(process.cwd(), 'public', 'movie')
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');

          let extension = 'mp4';

          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          cb(null, `${v4()}_${Date.now()}.${extension}`);
        },
      }),
    }),
    TypeOrmModule.forFeature([Movie]),
  ],
  controllers: [CommonController],
  providers: [CommonService, TasksService],
  exports: [CommonService],
})
export class CommonModule {}
