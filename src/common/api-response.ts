import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface IApiResponse<T> {
  success: boolean; // thành công hay không
  message?: string; // mô tả ngắn gọn
  data?: T; // dữ liệu trả về khi success
  code: number; // mã lỗi (nếu có)
  errors?: unknown;
  timestamp: Date;
}

export class ApiResponse<T> implements IApiResponse<T> {
  @ApiProperty({
    example: true,
    description: 'Trạng thái thành công của request',
  })
  public success: boolean;

  @ApiPropertyOptional({
    example: 'Thao tác thành công',
    description: 'Thông báo kết quả',
  })
  public message?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu trả về' })
  public data?: T;

  @ApiProperty({ example: 200, description: 'Mã HTTP status code' })
  public code: number;

  @ApiPropertyOptional({ description: 'Chi tiết lỗi nếu thất bại' })
  public errors?: unknown;

  @ApiProperty({
    example: '2026-10-27T10:00:00.000Z',
    description: 'Thời gian phản hồi',
  })
  public timestamp: Date;

  constructor(
    success: boolean,
    message?: string,
    data?: T,
    code: number = HttpStatus.OK,
    errors?: unknown,
    timestamp: Date = new Date(),
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.code = code;
    this.errors = errors;
    this.timestamp = timestamp;
  }
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
