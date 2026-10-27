import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exception-handler/http-exception.filter';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  app.enableCors({
    origin: ['http://localhost:5173', 'http://192.168.1.183:8081'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce Book API')
    .setDescription(
      'Tài liệu API chính thức cho hệ thống backend E-Commerce Book (NestJS 11, Prisma, MySQL 8.4, Redis, BullMQ).\n\n' +
        '### Các phân hệ chính:\n' +
        '- **Auth & Users**: Xác thực JWT (Stateless), Refresh Token, phiên thiết bị trên Redis, phân quyền RBAC.\n' +
        '- **Catalog**: Quản lý Sách (Book), Tác giả (Author), Thể loại (Category), Album ảnh (ImageBook).\n' +
        '- **Sales & Marketing**: Giỏ hàng (Carts), Khuyến mãi (Promotion), Mã giảm giá (Vouchers).\n' +
        '- **Orders & Logistics**: Quy trình đặt hàng, tích hợp đơn vị vận chuyển Giao Hàng Nhanh (GHN), Quản lý vận đơn (Shipments).\n' +
        '- **Inventory & Reviews**: Quản lý tồn kho & ghi vết xuất nhập (InventoryLog), Đánh giá & nhận xét sách (Reviews).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập JWT Access Token (Bearer <token>)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'E-Commerce Book API Docs',
  });

  await app.listen(3000);
}
bootstrap();
