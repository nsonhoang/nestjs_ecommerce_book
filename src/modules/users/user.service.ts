import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UserRepository } from './user.repository';
import { JwtUser } from 'src/strategies/jwt-payload.interface';
import { UserResponseDto } from './dto/user.response..dto';
import { UserQueryDto } from './dto/user-query.dto';

import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { UserUpdateRequestDto } from './dto/user-update.requset.dto';
import { RoleRepository } from '../roles/role.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

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

  //hàm getAllUsers chỉ dành cho admin, nên sẽ cần check role trong controller hoặc service trước khi gọi hàm này
  async getUsers(
    query: UserQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    try {
      const users = await this.userRepository.getUsers(query);
      return users;
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách người dùng', error);
      throw new BadRequestException('Không thể lấy danh sách người dùng');
    }
  }

  //hàm getUserById cũng chỉ dành cho admin, nên sẽ cần check role trong controller hoặc service trước khi gọi hàm này
  async getUserById(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('KHông tìm thấy người dùng');
      }
      return user;
    } catch (error) {
      this.logger.error(`Failed to fetch user with id ${id}`, error);
      throw new BadRequestException('Lỗi khi lấy thông tin người dùng');
    }
  }

  //hàm updateUser này sẽ dành cho cả admin, update đc cả role
  async updateUserByAdmin(
    id: string,
    updateData: Partial<UserUpdateRequestDto>,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('KHông tìm thấy người dùng');
      }
      //nếu có role thì tìm roleID
      // if (updateData.roleId) {
      //   const role = await this.roleRepository.findByName(updateData.roleId);
      //   const roleId = role?.id;
      //   if (!roleId) {
      //     throw new NotFoundException('Không tìm thấy role');
      //   }
      //   updateData.roleId = roleId; // gán lại roleId vào updateData để update vào database
      // }

      const updatedUser = await this.userRepository.updateUser(id, updateData);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user with id ${id}`, error);
      throw new BadRequestException('Lỗi khi cập nhật thông tin người dùng');
    }
  }

  //hàm updateUser này dành cho User và sẽ cập nhật sau
}
