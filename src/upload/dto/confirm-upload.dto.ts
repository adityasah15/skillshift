import { IsIn, IsString } from 'class-validator';

export class ConfirmUploadDto {
  @IsIn([
    'avatar',
    'service',
    'portfolio',
    'delivery',
  ])
  resource!: string;

  @IsString()
  resourceId!: string;

  @IsString()
  key!: string;
}