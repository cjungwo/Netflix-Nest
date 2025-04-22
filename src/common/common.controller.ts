import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';

@Controller('common')
@ApiBearerAuth()
export class CommonController {
  @RBAC(Role.admin)
  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 200000000,
      },
      fileFilter(req, file, callback) {
        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadRequestException('Only MP4 file accepted'),
            false,
          );
        }

        return callback(null, true);
      },
    }),
  )
  createVideo(@UploadedFile() video: Express.Multer.File) {
    return {
      fileName: video.filename,
    };
  }
}
