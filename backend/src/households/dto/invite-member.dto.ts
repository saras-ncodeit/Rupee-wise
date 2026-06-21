import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(['co_owner', 'member', 'viewer'])
  @IsNotEmpty()
  role: 'co_owner' | 'member' | 'viewer';
}
