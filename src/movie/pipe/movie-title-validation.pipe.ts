import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';

export class MovieTitleValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) return value;

    if (value.length <= 2) {
      throw new BadRequestException('Title is too short, minimum 3 characters');
    }

    return value;
  }
}
