import { plainToInstance } from 'class-transformer';
import { IsInt, IsString, IsUrl, Max, Min, MinLength, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsUrl({ protocols: ['postgresql', 'postgres'], require_tld: false })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters' })
  JWT_SECRET!: string;

  @IsInt()
  @Min(10)
  @Max(60 * 60 * 24)
  JWT_EXPIRES_IN_SECONDS: number = 3600;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;
}

/** Fails fast at startup so a missing or weak configuration never reaches runtime. */
export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, raw, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors.flatMap((e) => Object.values(e.constraints ?? {})).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return validated;
}
