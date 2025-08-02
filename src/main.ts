import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.use(bodyParser.json({ limit: '1mb' }));
  // app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
  app.enableCors({
    origin: 'https://demo.poshtyar.com', // دامنه کلاینت شما
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // متدهای مجاز
    credentials: true, // اگر نیاز به کوکی یا توکن دارید
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
