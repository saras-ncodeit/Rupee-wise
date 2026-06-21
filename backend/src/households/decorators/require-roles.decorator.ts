import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'household_roles';
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
