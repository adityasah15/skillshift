import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageEventDto {
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}
