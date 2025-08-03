import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key || key.length !== 64) {
      throw new BadRequestException('Invalid or missing ENCRYPTION_KEY');
    }
    this.encryptionKey = Buffer.from(key, 'hex');
    this.ensureDirectories();
  }

  // تنظیمات ذخیره‌سازی برای آواتار
  getAvatarStorage() {
    return diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    });
  }

  //フィルتر فرمت‌های مجاز برای آواتار
  avatarFileFilter(req, file, cb) {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('فقط فرمت‌های JPG و PNG مجاز هستند'), false);
    }
  }

  // تنظیمات ذخیره‌سازی برای اسناد
  getDocumentStorage() {
    return diskStorage({
      destination: './uploads/documents',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}.enc`);
      },
    });
  }

  // فیلتر فرمت‌های مجاز برای اسناد
  documentFileFilter(req, file, cb) {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException('فقط فرمت‌های PDF و DOC/DOCX مجاز هستند'),
        false,
      );
    }
  }

  // رمزنگاری فایل
  encryptFile(file: Express.Multer.File): Buffer {
    if (!file || !file.path) {
      throw new BadRequestException('فایل معتبر نیست یا مسیر فایل وجود ندارد');
    }
    console.log('Encrypting file:', file);
    // خواندن فایل از دیسک
    const fileBuffer = fs.readFileSync(file.path);
    const iv = crypto.randomBytes(16); // تولید IV تصادفی
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]); // IV + AuthTag + داده رمزنگاری‌شده
  }

  // رمزگشایی فایل (برای پردازش توسط هوش مصنوعی)
  decryptFile(filePath: string): Buffer {
    const fileBuffer = fs.readFileSync(filePath);
    const iv = fileBuffer.subarray(0, 16);
    const authTag = fileBuffer.subarray(16, 32);
    const encryptedData = fileBuffer.subarray(32);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      iv,
    );
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  // اطمینان از وجود پوشه‌ها
  ensureDirectories() {
    const avatarDir = './uploads/avatars';
    const documentDir = './Uploads/documents';
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }
    if (!fs.existsSync(documentDir)) {
      fs.mkdirSync(documentDir, { recursive: true });
    }
  }
}
