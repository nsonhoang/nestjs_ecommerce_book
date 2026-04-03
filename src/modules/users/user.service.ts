import { Injectable } from '@nestjs/common';
import { RolesRequestDto } from '../roles/dto/roles.dto.request';
import { RolesResponseDto } from '../roles/dto/roles.response.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  //xử lý global exception
  // format response
  //validate role name kh đc trùng
  getHello(): string {
    return 'Hello User!';
  }
}
