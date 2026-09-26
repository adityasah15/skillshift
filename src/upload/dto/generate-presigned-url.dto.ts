import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';

export class GeneratePresignedUrlDto {
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
  fileName!: string;

  @IsIn([
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/zip',
  ])
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  fileSize!: number;
}