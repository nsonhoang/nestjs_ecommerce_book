import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../api-response';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Lỗi Hệ Thống';
    let errors: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        // Trường hợp message là string
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse) {
        const responseObj = exceptionResponse as Record<string, any>;

        // Với ValidationPipe, message thường là mảng string
        if (Array.isArray(responseObj.message)) {
          // lấy message đầu tiên: "Tên role không được để trống"
          message = 'Lỗi';
          errors = responseObj.message;
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
        }

        if (responseObj.errors) {
          errors = responseObj.errors;
        }
      }
    }

    const apiResponse =
      errors != null
        ? ApiResponse.error(message, status, errors)
        : ApiResponse.message(message, status);

    res.status(status).json(apiResponse);
  }
}
