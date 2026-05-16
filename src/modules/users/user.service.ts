import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UserRepository } from './user.repository';
import { JwtUser } from 'src/strategies/jwt-payload.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { UserQueryDto } from './dto/user-query.dto';
import * as bcrypt from 'bcrypt';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { UserUpdateRequestDto } from './dto/user-update.request.dto';
import { User } from './user.interface';
import { UserRequestDto } from './dto/user.request.dto';

const SULT_ROUNDS = 10;

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

  async getUserByEmail(email: string): Promise<User | null> {
    //.hàm này sẽ dùng trong authService để check email khi đăng nhập hoặc đăng ký, nên sẽ trả về User thay vì UserResponseDto để có thể lấy được password để so sánh
    try {
      const user = await this.userRepository.findByEmail(email);
      return user;
    } catch (error) {
      this.logger.error(`Failed to fetch user with email ${email}`, error);
      throw new NotFoundException('Lỗi khi lấy thông tin người dùng');
    }
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
  async createUser(userRequest: UserRequestDto): Promise<UserResponseDto> {
    const hashedPassword = await bcrypt.hash(userRequest.password, SULT_ROUNDS);

    if (!userRequest.roleId) {
      throw new BadRequestException('RoleId là bắt buộc');
    }
    const userCreateInput = {
      email: userRequest.email,
      password: hashedPassword,
      name: userRequest.name,
      phone: userRequest.phone,
      roleId: userRequest.roleId,
    };

    return this.userRepository.createUser(userCreateInput);
  }

  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, SULT_ROUNDS);
    const result = await this.userRepository.changePassword(
      userId,
      hashedPassword,
    );
    return result;
  }
  //hàm updateUser này dành cho User và sẽ cập nhật sau
  async updateUserByUser(
    userId: string,
    updateData: Partial<UserUpdateRequestDto>,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('KHông tìm thấy người dùng');
      }
      // User chỉ được cập nhật thông tin cá nhân, không được cập nhật role
      if (updateData.roleId) {
        throw new BadRequestException('Bạn không có quyền cập nhật role');
      }
      const updatedUser = await this.userRepository.updateUser(
        userId,
        updateData,
      );
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user with id ${userId}`, error);
      throw new BadRequestException('Lỗi khi cập nhật thông tin người dùng');
    }
  }
}
