import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Accepts absolute URLs (manual links) as well as raw storage keys written
 * by `POST /upload/confirm` (e.g. `portfolios/<userId>/<file>`). Without the
 * key branch, any profile save after an upload would either wipe the uploads
 * (array replace) or 400 on validation.
 */
@ValidatorConstraint({ name: 'portfolioEntry', async: false })
class PortfolioEntryConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.length < 1 || value.length > 2048) {
      return false;
    }
    if (/^https?:\/\//i.test(value)) {
      try {
        new URL(value);
      } catch {
        return false;
      }
      return true;
    }
    if (value.includes('..') || value.includes('\\')) {
      return false;
    }
    return /^(avatars|portfolios|services|deliveries)\/[^/]+\/[^/]+$/.test(
      value,
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a URL or an uploaded file key`;
  }
}

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
  @IsArray()
  @Validate(PortfolioEntryConstraint, { each: true })
  portfolioUrls?: string[];
}
