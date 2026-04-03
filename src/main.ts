import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exception-handler/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // bỏ các field thừa
      forbidNonWhitelisted: true, // nếu gửi field không có trong DTO thì báo lỗi
      transform: true, // tự cast kiểu (string -> number, ...)
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
}
bootstrap();
