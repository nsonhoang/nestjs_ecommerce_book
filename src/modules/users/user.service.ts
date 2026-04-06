import { Injectable } from '@nestjs/common';

import { UserRepository } from './user.repository';
import { JwtUser } from 'src/strategies/jwt-payload.interface';
import { UserResponseDto } from './dto/user.response..dto';
@Injectable()
export class UserService {
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
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error('Failed to fetch user profile');
    }
  }
}
