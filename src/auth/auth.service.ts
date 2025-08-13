import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<void> {
    // خروجی به void تغییر کرد
    const user = await this.usersService.create(createUserDto);
    // در user.service.ts، متد create باید خودش OTP را تولید و ذخیره کند.
    // اینجا فقط ایمیل را برای ارسال OTP می‌فرستیم.
    await this.notificationsService.sendOtpEmail(
      user.companyEmail,
      user.companyName,
      user.otpCode!,
    );
    // دیگر نیازی به return نیست
  }

  async login(companyEmail: string, password: string): Promise<void> {
    const user = await this.usersService.findByEmail(companyEmail);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('پسورد اشتباه است.');
    }
    const otp = await this.usersService.generateOtp(companyEmail);
    await this.notificationsService.sendOtpEmail(
      companyEmail,
      user.companyName,
      otp,
    );
  }

  async sendOtp(companyEmail: string): Promise<void> {
    const user = await this.usersService.findByEmail(companyEmail);
    if (!user) {
      throw new BadRequestException('سازمانی پیدا نشد.');
    }
    const otp = await this.usersService.generateOtp(companyEmail);
    await this.notificationsService.sendOtpEmail(
      companyEmail,
      user.companyName,
      otp,
    );
  }

  async validateOtp(companyEmail: string, otp: string): Promise<string> {
    const isValid = await this.usersService.verifyOtp(companyEmail, otp);
    if (!isValid) {
      throw new BadRequestException('کد تایید نادرست است');
    }
    const user = await this.usersService.findByEmail(companyEmail);
    const payload = {
      sub: user._id,
      email: user.companyEmail,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(payload: any): Promise<any> {
    const user = await this.usersService.findOne(payload.sub);
    return user;
  }

  async findByEmail(companyEmail: string): Promise<any> {
    const user = await this.usersService.findByEmail(companyEmail);
    if (!user) {
      throw new BadRequestException('سازمانی پیدا نشد.');
    }
    return user;
  }

  async sendForgotPasswordOtp(companyEmail: string): Promise<void> {
    const user = await this.usersService.findByEmail(companyEmail);
    if (!user) {
      throw new NotFoundException('کاربری با این ایمیل یافت نشد.');
    }
    const otp = await this.usersService.generateOtp(companyEmail);
    // می‌توانید از یک قالب ایمیل متفاوت برای فراموشی رمز عبور استفاده کنید
    await this.notificationsService.sendOtpEmail(
      companyEmail,
      user.companyName,
      otp,
    );
  }

  // جدید: متد برای تأیید OTP و صدور توکن بازنشانی
  async verifyForgotPasswordOtp(
    companyEmail: string,
    otp: string,
  ): Promise<string> {
    const isValid = await this.usersService.verifyOtp(companyEmail, otp);
    if (!isValid) {
      throw new BadRequestException('کد تایید نادرست است.');
    }
    const user = await this.usersService.findByEmail(companyEmail);
    // ایجاد یک توکن کوتاه‌مدت فقط برای بازنشانی رمز عبور
    const payload = {
      sub: user._id,
      email: user.companyEmail,
      purpose: 'reset-password',
    };
    return this.jwtService.sign(payload, { expiresIn: '10m' }); // 10 دقیقه اعتبار
  }

  // جدید: متد برای بازنشانی رمز عبور با استفاده از توکن
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(resetToken);
      if (payload.purpose !== 'reset-password') {
        throw new UnauthorizedException('توکن نامعتبر است.');
      }
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new NotFoundException('کاربر یافت نشد.');
      }
      await this.usersService.updatePassword(user.companyEmail, newPassword);
    } catch (error) {
      throw new UnauthorizedException('توکن نامعتبر یا منقضی شده است.');
    }
  }
}
