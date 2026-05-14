import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exception-handler/http-exception.filter';
import cookieParser from 'cookie-parser';
// import { NestExpressApplication } from '@nestjs/platform-express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.set('trust proxy', 'loopback'); // hoặc 1 / true tùy môi trường
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // bỏ các field thừa
      forbidNonWhitelisted: true, // nếu gửi field không có trong DTO thì báo lỗi
      transform: true, // tự cast kiểu (string -> number, ...)
    }),
  );
  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({ origin: 'http://localhost:5173', credentials: true });

  await app.listen(3000);
}
bootstrap();
