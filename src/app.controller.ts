import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Kiểm tra trạng thái hệ thống (Health Check)' })
  @ApiOkResponse({ description: 'Hệ thống hoạt động bình thường', type: String })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
