import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthController {
    private readonly authService;
    private readonly jwtService;
    private readonly usersService;
    constructor(authService: AuthService, jwtService: JwtService, usersService: UsersService);
    private setRefreshTokenCookie;
    private clearRefreshTokenCookie;
    register(dto: RegisterDto, res: Response): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string | null;
        };
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string | null;
        };
    }>;
    refresh(req: Request, res: Response): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string | null;
        };
    }>;
    logout(res: Response): Promise<{
        status: string;
        message: string;
    }>;
}
