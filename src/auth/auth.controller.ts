import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const { user } = await this.authService.register(createUserDto);
    return { message: 'Registration successful, OTP sent to email', user };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    await this.authService.login(body.email, body.password);
    return { message: 'OTP sent to email' };
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { email: string }) {
    await this.authService.sendOtp(body.email);
    return { message: 'OTP sent to email' };
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() body: { email: string; otp: string },
    @Res() res: express.Response,
  ) {
    const token = await this.authService.validateOtp(body.email, body.otp);
    res.cookie('poshtyar_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 * 24, // 1 hour
    });
    return res.status(HttpStatus.OK).json({ message: 'Login successful' });
  }
}
