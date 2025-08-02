import {
  IsString,
  IsEmail,
  Matches,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { OrganizationalRole } from '../schemas/user.schema';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  companyName: string;

  @IsEmail()
  @IsOptional()
  @Matches(/^(?!.*@(gmail\.com|yahoo\.com)$).*$/, {
    message: 'یک ایمیل سازمانی وارد کنید',
  })
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsNumber()
  @IsOptional()
  activeOperatorsCount?: number;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9\s-]{7,15}$/, {
    message: 'شماره تلفن صحیح وارد کنید',
  })
  voicePhoneNumber?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsOptional()
  @IsEnum(['admin', 'user'])
  role?: string;

  @IsOptional()
  @IsEnum(OrganizationalRole)
  organizationalRole?: OrganizationalRole;
}
