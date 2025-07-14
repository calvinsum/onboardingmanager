import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcknowledgeTermsDto {
  @ApiProperty({ description: 'Full name of the person acknowledging the terms' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'ID of the terms and conditions version being acknowledged' })
  @IsUUID()
  @IsNotEmpty()
  termsVersionId: string;
}

export class CreateTermsConditionsDto {
  @ApiProperty({ description: 'Version number' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ description: 'Terms and conditions content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Effective date' })
  @IsString()
  @IsNotEmpty()
  effectiveDate: string;
}

export class UpdateTermsConditionsDto {
  @ApiProperty({ description: 'Terms and conditions content' })
  @IsString()
  @IsNotEmpty()
  content: string;
} 