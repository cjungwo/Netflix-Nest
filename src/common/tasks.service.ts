import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
    // private readonly logger: DefaultLogger,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  // @Cron('*/10 * * * * *')
  logEverySecond() {
    // this.logger.fatal('FATAL LEVEL LOG'); // error never happen
    this.logger.error('ERROR LEVEL LOG', null, TasksService.name); // error with program execution
    this.logger.warn('WARN LEVEL LOG', TasksService.name); // error without program execution
    this.logger.log('LOG LEVEL LOG', TasksService.name); // info log
    // this.logger.debug('DEBUG LEVEL LOG'); // dev mode log
    // this.logger.verbose('VERBOSE LEVEL LOG', TasksService.name);
  }

  // @Cron('*/30 * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));
    console.log(files);

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name;

      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +Date.now();

        return now - date > aDayInMilSec;
      } catch (err) {
        return true;
      }
    });

    console.log(deleteFilesTargets);

    await Promise.all(
      deleteFilesTargets.map((file) => {
        unlink(join(process.cwd(), 'public', 'temp', file));
      }),
    );
  }

  // @Cron('0 * * * * *')
  async calcMovieLikeCount() {
    console.log('[DEBUG] Run !!!');
    await this.movieRepository.query(
      `
      UPDATE movie m
      SET "likeCount" = (
        SELECT count(*) FROM movie_user_like mul
        WHERE m.id = mul."movieId" AND mul."isLike" = true
      )
      `,
    );

    await this.movieRepository.query(
      `
      UPDATE movie m
      SET "dislikeCount" = (
        SELECT count(*) FROM movie_user_like mul
        WHERE m.id = mul."movieId" AND mul."isLike" = false
      )
      `,
    );
  }

  // @Cron('* * * * * *', {
  //   name: 'printer',
  // })
  printer() {
    console.log('[DEBUG] printer run');
  }

  // @Cron('*/10 * * * * *')
  stopper() {
    console.log('[DEBUG] stopper run');

    const job = this.schedulerRegistry.getCronJob('printer');

    console.log('# Last Date');
    console.log(job.lastDate());
    console.log('# Next Date');
    console.log(job.nextDate());
    console.log('# Next Dates');
    console.log(job.nextDates(5));

    if (job.isActive) {
      job.stop();
    } else {
      job.start();
    }
  }
}
