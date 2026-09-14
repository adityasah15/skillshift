import { IsInt, IsPositive } from "class-validator";

export class DepositDto {
  
  @IsInt()
  @IsPositive()
  amount! : number
}
