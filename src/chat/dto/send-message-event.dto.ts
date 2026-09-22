import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SendMessageEventDto {
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}