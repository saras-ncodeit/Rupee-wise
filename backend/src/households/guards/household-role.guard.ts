import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/require-roles.decorator';

@Injectable()
export class HouseholdRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Extract householdId from params, headers, body, or query
    let householdId = request.params.householdId || 
                      request.headers['x-household-id'] || 
                      request.body.householdId || 
                      request.query.householdId;

    if (Array.isArray(householdId)) {
      householdId = householdId[0];
    }

    if (!householdId) {
      throw new BadRequestException('Household ID is required for this request');
    }

    // Check membership and role in DB
    const member = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: user.id,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this household');
    }

    // Attach membership to request for controller use
    request.householdMember = member;

    // If no specific roles are required, membership is sufficient
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Check role authorization
    const hasRole = requiredRoles.includes(member.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
