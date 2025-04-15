import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { rename } from 'fs/promises';
import { join } from 'path';
import { v4 } from 'uuid';

@Injectable()
export class MovieFilePipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  constructor(
    private readonly options: {
      maxSize: number;
      mimetype: string;
    },
  ) {}

  async transform(
    value: Express.Multer.File,
    metadata: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException('Movie field is neccessory');
    }

    const byteSize = this.options.maxSize * 1000000;

    if (value.size > byteSize) {
      throw new BadRequestException(
        `Able to upload under ${this.options.maxSize}MB`,
      );
    }

    if (value.mimetype !== this.options.mimetype) {
      throw new BadRequestException(`Able to upload ${this.options.mimetype}`);
    }

    const split = value.originalname.split('.');

    let extension = 'mp4';

    if (split.length > 1) {
      extension = split[split.length - 1];
    }

    const filename = `${v4()}_${Date.now()}.${extension}`;

    const newPath = join(value.destination, 'filename');

    await rename(value.path, newPath);

    return {
      ...value,
      filename,
    };
  }
}
