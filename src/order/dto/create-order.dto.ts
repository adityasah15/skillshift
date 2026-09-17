import { IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  serviceId!: string;

  @IsOptional()
  @IsString()
  requirements?: string;
}
