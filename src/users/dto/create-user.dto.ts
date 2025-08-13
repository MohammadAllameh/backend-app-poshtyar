import {
  IsString,
  IsEmail,
  IsNotEmpty,
  Matches,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { OrganizationalRole } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(/^(?!.*@(gmail\.com|yahoo\.com)$).*$/, {
    message: 'یک ایمیل سازمانی وارد کنید',
  })
  companyEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsNumber()
  @IsNotEmpty()
  activeOperatorsCount?: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s-]{7,15}$/, {
    message: 'شماره تلفن صحیح وارد کنید',
  })
  voicePhoneNumber: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsEnum(OrganizationalRole)
  @IsNotEmpty()
  organizationalRole: OrganizationalRole;
}
