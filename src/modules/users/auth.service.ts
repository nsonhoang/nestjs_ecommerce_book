import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { AuthRequestDto } from './dto/auth.request.dto';
import { UserResponseDto } from './dto/user.response..dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  //xử lý global exception
  // format response
  //validate role name kh đc trùng
  async login(authRequest: AuthRequestDto): Promise<boolean> {
    const user = await this.userRepository.findByEmail(authRequest.email);
    if (!user) {
      throw new NotFoundException(
        'Không tìm thấy người dùng với email :' + authRequest.email,
      );
    }
    const isMatch = await bcrypt.compare(authRequest.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }
    return isMatch;
  }
}
