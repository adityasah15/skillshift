import { IsString, IsUUID } from 'class-validator';

export class CreateDisputeDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  reason!: string;
}