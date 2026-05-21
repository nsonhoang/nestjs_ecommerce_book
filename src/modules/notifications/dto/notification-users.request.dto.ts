import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class NotificationUsersRequestDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty({ message: 'userIds không được để trống' })
  userIds!: string[];

  @IsString()
  @IsNotEmpty({ message: 'title không được để trống' })
  title!: string;
  @IsString()
  @IsNotEmpty({ message: 'body không được để trống' })
  body!: string;
}
