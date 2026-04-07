import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UserRepository } from './user.repository';
import { JwtUser } from 'src/strategies/jwt-payload.interface';
import { UserResponseDto } from './dto/user.response..dto';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly userRepository: UserRepository) {}

  //xử lý global exception
  // format response
  //validate role name kh đc trùng
  getHello(): string {
    return 'Hello User!';
  }

  async getProfile(payload: JwtUser): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error('Failed to fetch user profile', error);
      throw new BadRequestException('Failed to fetch user profile');
    }
  }
  //viết thêm các method liên quan đến user như update profile, change password,get all users (dành cho admin),... nếu cần
}
