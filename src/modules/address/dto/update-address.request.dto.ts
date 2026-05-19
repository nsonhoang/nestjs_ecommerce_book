import { PartialType } from '@nestjs/swagger';
import { AddressRequestDTO } from './address.request.dto';

export class UpdateAddressDto extends PartialType(AddressRequestDTO) {}
