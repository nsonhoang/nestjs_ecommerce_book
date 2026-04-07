export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string | null;
  phone!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  role!: { id: string; name: string } | null;
}
