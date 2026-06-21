import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.usersService.create(dto.email, passwordHash, dto.fullName);
    return this.login(user);
  }

  async validateUser(dto: LoginDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async login(user: Omit<User, 'passwordHash'> | User) {
    const payload = { sub: user.id, email: user.email };
    
    // Access token (15 mins)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // Refresh token (30 days)
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    await this.usersService.updateLastLogin(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 mins in seconds
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
