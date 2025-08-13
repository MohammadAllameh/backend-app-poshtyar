import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res() res: express.Response,
  ) {
    await this.authService.register(createUserDto);
    return res.status(HttpStatus.OK).json({
      message: 'Registration successful, OTP sent to email',
      companyEmail: createUserDto.companyEmail,
    });
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { companyEmail: string }) {
    await this.authService.sendOtp(body.companyEmail);
    return { message: 'OTP sent to email' };
  }

  @Post('login')
  async login(
    @Body() body: { companyEmail: string; password: string },
    @Res() res: express.Response,
  ) {
    // 1. فقط لاگین را صدا می‌زنیم تا رمز را چک کند و OTP بفرستد
    await this.authService.login(body.companyEmail, body.password);

    // 2. دیگر توکن و کوکی اینجا صادر نمی‌کنیم!

    // 3. فقط یک پیام موفقیت‌آمیز برمی‌گردانیم تا فرانت‌اند بداند که باید به صفحه verify برود
    return res.status(HttpStatus.OK).json({
      message: 'Password is valid, OTP sent to email',
      // اطلاعات کاربر را هم برمی‌گردانیم تا در فرانت‌اند استفاده شود
      companyEmail: body.companyEmail,
    });
  }

  // متد verify-otp حالا مسئول اصلی صدور توکن است و کاملا درست عمل می‌کند.
  @Post('verify-otp')
  async verifyOtp(
    @Body() body: { companyEmail: string; otp: string },
    @Res() res: express.Response,
  ) {
    const token = await this.authService.validateOtp(
      body.companyEmail,
      body.otp,
    );
    res.cookie('poshtyar_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 * 24, // 24 ساعت
    });
    // پس از تأیید موفق، اطلاعات کامل کاربر را برمی‌گردانیم
    const user = await this.authService.findByEmail(body.companyEmail);
    return res.status(HttpStatus.OK).json({
      message: 'Verification successful',
      user: {
        id: user._id,
        companyEmail: user.companyEmail,
        isVerified: user.isVerified,
      },
    });
  }

  @Get('me')
  async getUser(@Req() req: express.Request) {
    const token = req.cookies.poshtyar_token;
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    const payload = this.jwtService.verify(token);
    const user = await this.authService.validateUser(payload);
    return {
      id: user._id,
      companyEmail: user.companyEmail,
      role: user.role,
      companyName: user.companyName,
      isVerified: user.isVerified,
    };
  }

  @Get('logout')
  async logout(@Res() res: express.Response) {
    res.clearCookie('poshtyar_token');
    return res.status(HttpStatus.OK).json({ message: 'Logout successful' });
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { companyEmail: string }) {
    await this.authService.sendForgotPasswordOtp(body.companyEmail);
    return { message: 'OTP for password reset sent to email' };
  }

  // جدید: Endpoint برای تأیید OTP و دریافت توکن بازنشانی
  @Post('verify-forgot-password-otp')
  async verifyForgotPasswordOtp(
    @Body() body: { companyEmail: string; otp: string },
  ) {
    const resetToken = await this.authService.verifyForgotPasswordOtp(
      body.companyEmail,
      body.otp,
    );
    // این توکن به فرانت‌اند ارسال می‌شود تا در مرحله بعد استفاده شود
    return { resetToken };
  }

  // جدید: Endpoint برای بازنشانی رمز عبور
  @Post('reset-password')
  async resetPassword(
    @Body() body: { resetToken: string; newPassword: string },
  ) {
    await this.authService.resetPassword(body.resetToken, body.newPassword);
    return { message: 'Password has been reset successfully' };
  }
}
