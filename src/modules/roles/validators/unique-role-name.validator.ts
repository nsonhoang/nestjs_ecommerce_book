import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../role.repository';

//không cần
@ValidatorConstraint({ name: 'UniqueRoleName', async: true })
@Injectable()
export class UniqueRoleNameValidator implements ValidatorConstraintInterface {
  constructor(private readonly roleRepository: RoleRepository) {}

  async validate(value: string): Promise<boolean> {
    if (!value) return true;

    const upperName = value.toUpperCase();

    const exists = await this.roleRepository.findByName(upperName);
    console.log('exists', exists);
    // findByName hiện trả về boolean nên dùng trực tiếp:
    return !exists;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Role name đã tồn tại';
  }
}
