import { Body, Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  get(): string {
    return this.userService.getHello();
  }
}
