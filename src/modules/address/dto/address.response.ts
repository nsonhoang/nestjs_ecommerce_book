export class AddressResponseDTO {
  id!: string;

  userId!: string;

  fullName!: string;

  phone!: string;

  addressLine!: string;

  ward!: string;

  district!: string;

  city!: string;

  // 🌍 Optional

  country?: string;

  label?: string | null;

  isDefault?: boolean;
}
