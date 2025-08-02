import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly configService: ConfigService,
  ) {
    this.uploadsService.ensureDirectories();
  }

  @Post('avatar')
  // @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: UploadsService.prototype.getAvatarStorage(),
      fileFilter: UploadsService.prototype.avatarFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // حداکثر 5MB
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('فایلی آپلود نشده است');
    }
    const baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/avatars/${file.filename}`;
    return {
      message: 'آواتار با موفقیت آپلود شد',
      fileUrl, // لینک کامل
    };
  }

  @Post('document')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: UploadsService.prototype.getDocumentStorage(),
      fileFilter: UploadsService.prototype.documentFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // حداکثر 10MB
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('فایلی آپلود نشده است');
    }
    // رمزنگاری فایل
    const encryptedData = this.uploadsService.encryptFile(file);
    fs.writeFileSync(file.path, encryptedData);
    return {
      message: 'سند با موفقیت آپلود و رمزنگاری شد',
      filePath: `uploads/documents/${file.filename}`,
    };
  }
}
