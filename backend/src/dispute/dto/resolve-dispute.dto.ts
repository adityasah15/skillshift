import { IsIn, IsOptional, IsString } from 'class-validator';

export class ResolveDisputeDto {
  @IsIn(['RESOLVED_FREELANCER', 'RESOLVED_CLIENT'])
  resolution!: 'RESOLVED_FREELANCER' | 'RESOLVED_CLIENT';

  @IsOptional()
  @IsString()
  adminNote?: string;
}
