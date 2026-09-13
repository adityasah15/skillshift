import { IsArray, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateProfileDto {
  
  @IsOptional()
  @MinLength(1)
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsUrl({}, { each: true })
  @IsArray()
  portfolioUrls?: string[];
}
