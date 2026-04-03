import { HttpCode, HttpStatus } from '@nestjs/common';

export interface IApiResponse<T> {
  success: boolean; // thành công hay không
  message?: string; // mô tả ngắn gọn
  data?: T; // dữ liệu trả về khi success
  code: number; // mã lỗi (nếu có)
  errors?: unknown;
  timestamp: Date;
}

export class ApiResponse<T> implements IApiResponse<T> {
  constructor(
    public success: boolean,
    public message?: string,
    public data?: T,
    public code: number = HttpStatus.OK,
    public errors?: unknown,
    public timestamp: Date = new Date(),
  ) {}
  static ok<T>(
    data: T,
    message?: string,
    code: number = HttpStatus.OK,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      code,
      timestamp: new Date(),
    };
  }

  static error(
    message: string,
    code: number = HttpStatus.INTERNAL_SERVER_ERROR,
    errors?: unknown,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      code,
      errors,
      timestamp: new Date(),
    };
  }
  static message(
    message: string,
    code: number = HttpStatus.OK,
  ): ApiResponse<unknown> {
    const httpCode = code as HttpStatus;
    return {
      success: httpCode === HttpStatus.OK || httpCode === HttpStatus.CREATED,
      message,
      code,
      timestamp: new Date(),
    };
  }
}
