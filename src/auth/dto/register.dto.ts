import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import {Role} from "generated/prisma/enums";

export class RegisterDto {
  @IsEmail()
  email! : string;

  @IsString()
  @MinLength(8)
  password! : string;

  //only allow role to be set to CLIENT or FREELANCER, not ADMIN
  @IsOptional()
  @IsIn([Role.CLIENT, Role.FREELANCER])
  role? : Role;
}