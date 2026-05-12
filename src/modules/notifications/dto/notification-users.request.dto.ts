import { IsArray, IsEmpty, IsString } from 'class-validator';

export class NotificationUsersRequestDto {
  @IsArray()
  @IsString({ each: true })
  @IsEmpty({ message: 'userIds không được để trống' })
  userIds!: string[];

  @IsString()
  @IsEmpty({ message: 'title không được để trống' })
  title!: string;
  @IsString()
  @IsEmpty({ message: 'body không được để trống' })
  body!: string;
}
