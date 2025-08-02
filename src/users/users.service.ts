import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const createdUser = new this.userModel({
      ...rest,
      password: hashedPassword,
      otpCode,
      otpExpiresAt,
      isVerified: false,
    });
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new BadRequestException('سازمانی پیدا نشد');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new BadRequestException('سازمانی پیدا نشد');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!updatedUser) {
      throw new BadRequestException('سازمانی پیدا نشد');
    }
    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new BadRequestException('سازمانی پیدا نشد');
    }
    return deletedUser;
  }

  async generateOtp(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.userModel.updateOne({ email }, { otpCode, otpExpiresAt });
    return otpCode; // In production, send via email/SMS
  }

  async verifyOtp(email: string, otpCode: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user.otpCode || user.otpExpiresAt! < new Date()) {
      throw new BadRequestException('کد تایید منقضی شده است');
    }
    if (user.otpCode !== otpCode) {
      throw new BadRequestException('کد تایید نادرست است');
    }
    await this.userModel.updateOne(
      { email },
      { isVerified: true, otpCode: null, otpExpiresAt: null },
    );
    return true;
  }
}
