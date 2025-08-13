import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum OrganizationalRole {
  Manager = 'مدیر سازمان',
  Technical = 'بخش فنی',
  Operator = 'اپراتور سازمان',
  PublicRelations = 'روابط عمومی',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  companyName: string;

  @Prop({ required: true, unique: true })
  companyEmail: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  avatar?: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ required: true, enum: ['admin', 'user'], default: 'user' })
  role: string;

  @Prop({ default: 0 })
  activeOperatorsCount: number;

  @Prop({ required: true })
  voicePhoneNumber: string;

  @Prop()
  website?: string;

  @Prop({ required: true, enum: OrganizationalRole })
  organizationalRole: OrganizationalRole;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  otpCode?: string;

  @Prop()
  otpExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
