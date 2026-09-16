import { IsArray, IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateServiceDto {

  @IsNotEmpty()
  @IsString()
  title!: string;
  
  @IsNotEmpty()
  @IsString()
  description!: string;
  
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  price!: number;
  
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  deliveryDays!: number;
  
  @IsNotEmpty()
  @IsArray()
  @IsString({each: true})
  skills!: string[];
  
  @IsNotEmpty()
  @IsArray()
  @IsString({each: true})
  imageUrls!: string[];

}
