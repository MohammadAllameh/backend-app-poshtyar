import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
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

  async register(createUserDto: CreateUserDto): Promise<{ user: any }> {
    const user = await this.usersService.create(createUserDto);
    const otp = await this.usersService.generateOtp(createUserDto.email);
    await this.notificationsService.sendOtpEmail(
      createUserDto.email,
      createUserDto.companyName,
      otp,
    );
    return { user: { id: user._id, email: user.email } };
  }

  async login(email: string, password: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('پسورد اشتباه است.');
    }
    const otp = await this.usersService.generateOtp(email);
    await this.notificationsService.sendOtpEmail(email, user.companyName, otp);
  }

  async sendOtp(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('سازمانی پیدا نشد.');
    }
    const otp = await this.usersService.generateOtp(email);
    await this.notificationsService.sendOtpEmail(email, user.companyName, otp);
  }

  async validateOtp(email: string, otp: string): Promise<string> {
    const isValid = await this.usersService.verifyOtp(email, otp);
    if (!isValid) {
      throw new BadRequestException('کد تایید نادرست است');
    }
    const user = await this.usersService.findByEmail(email);
    const payload = { sub: user._id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  async validateUser(payload: any): Promise<any> {
    const user = await this.usersService.findOne(payload.sub);
    return user;
  }
}
