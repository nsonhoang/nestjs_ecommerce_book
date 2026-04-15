import { PartialType } from '@nestjs/mapped-types';
import { AddressRequestDTO } from './address.request.dto';

export class UpdateAddressDto extends PartialType(AddressRequestDTO) {}
