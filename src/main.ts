import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import * as express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // مسیر صحیح برای فایل‌های استاتیک
    index: false,
  });
  // app.use(bodyParser.json({ limit: '1mb' }));
  // app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
  // app.use(express.static(join(__dirname, '..', 'uploads'), { index: false }));

  app.use(cookieParser());
  app.enableCors({
    origin: true,
    // origin: 'https://demo.poshtyar.com', // دامنه کلاینت شما
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // متدهای مجاز
    credentials: true, // اگر نیاز به کوکی یا توکن دارید
  });
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
