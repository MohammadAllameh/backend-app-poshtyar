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
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsNumber()
  @IsOptional()
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

  @IsEnum(['admin', 'user'])
  role: string;

  @IsEnum(OrganizationalRole)
  @IsNotEmpty()
  organizationalRole: OrganizationalRole;
}
