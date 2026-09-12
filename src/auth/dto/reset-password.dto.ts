import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
