import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsEnum(['co_owner', 'member', 'viewer'])
  @IsNotEmpty()
  role: 'co_owner' | 'member' | 'viewer';
}
