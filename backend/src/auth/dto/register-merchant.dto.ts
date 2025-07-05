import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterMerchantDto {
  @ApiProperty({ description: 'Merchant email address', example: 'merchant@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Merchant password', example: 'password123', minLength: 6, maxLength: 50 })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
} 