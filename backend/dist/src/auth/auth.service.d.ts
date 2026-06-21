import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string | null;
        };
    }>;
    validateUser(dto: LoginDto): Promise<Omit<User, 'passwordHash'>>;
    login(user: Omit<User, 'passwordHash'> | User): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string | null;
        };
    }>;
}
