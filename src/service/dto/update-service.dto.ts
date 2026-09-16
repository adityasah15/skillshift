import { IsArray, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateServiceDto {

  @IsOptional()
  @IsString()
  title?: string;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsInt()
  @IsPositive()
  price?: number;
  
  @IsOptional()
  @IsInt()
  @IsPositive()
  deliveryDays?: number;
  
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  skills?: string[];
  
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  imageUrls?: string[];

}
