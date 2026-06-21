import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class HouseholdsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateHouseholdDto) {
    return this.prisma.$transaction(async (tx) => {
      // Create household
      const household = await tx.household.create({
        data: {
          name: dto.name,
          currency: dto.currency || 'INR',
          timezone: dto.timezone || 'Asia/Kolkata',
          createdBy: userId,
        },
      });

      // Create owner membership
      await tx.householdMember.create({
        data: {
          householdId: household.id,
          userId,
          role: 'owner',
          displayName: null, // Can be set later
        },
      });

      return household;
    });
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.householdMember.findMany({
      where: { userId },
      include: {
        household: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.household,
      userRole: m.role,
    }));
  }

  async findOne(householdId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    return household;
  }

  async invite(householdId: string, dto: InviteMemberDto, invitedBy: string) {
    const userToInvite = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!userToInvite) {
      throw new NotFoundException('User with this email address is not registered');
    }

    const existingMember = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: userToInvite.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this household');
    }

    return this.prisma.householdMember.create({
      data: {
        householdId,
        userId: userToInvite.id,
        role: dto.role,
        invitedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async removeMember(householdId: string, targetUserId: string, operatorUserId: string) {
    const targetMember = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this household');
    }

    if (targetMember.role === 'owner') {
      throw new BadRequestException('Cannot remove the household owner. The owner must transfer ownership first or delete the household.');
    }

    // Check operator authority
    if (operatorUserId !== targetUserId) {
      const operatorMember = await this.prisma.householdMember.findUnique({
        where: {
          householdId_userId: {
            householdId,
            userId: operatorUserId,
          },
        },
      });

      if (!operatorMember) {
        throw new ForbiddenException('Operator is not a member of this household');
      }

      if (operatorMember.role !== 'owner' && operatorMember.role !== 'co_owner') {
        throw new ForbiddenException('Only owners and co-owners can remove household members');
      }

      // co_owners cannot remove other co_owners
      if (operatorMember.role === 'co_owner' && targetMember.role === 'co_owner') {
        throw new ForbiddenException('Co-owners cannot remove other co-owners');
      }
    }

    return this.prisma.householdMember.delete({
      where: {
        householdId_userId: {
          householdId,
          userId: targetUserId,
        },
      },
    });
  }

  async updateMemberRole(
    householdId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
    operatorUserId: string,
  ) {
    const targetMember = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this household');
    }

    if (targetMember.role === 'owner') {
      throw new BadRequestException('Cannot modify the role of the household owner.');
    }

    const operatorMember = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: operatorUserId,
        },
      },
    });

    if (!operatorMember) {
      throw new ForbiddenException('Operator is not a member of this household');
    }

    if (operatorMember.role !== 'owner' && operatorMember.role !== 'co_owner') {
      throw new ForbiddenException('Only owners and co-owners can update member roles');
    }

    if (operatorMember.role === 'co_owner') {
      if (targetMember.role === 'co_owner') {
        throw new ForbiddenException('Co-owners cannot modify roles of other co-owners');
      }
      if (dto.role === 'co_owner') {
        throw new ForbiddenException('Co-owners cannot promote members to co-owner');
      }
    }

    return this.prisma.householdMember.update({
      where: {
        householdId_userId: {
          householdId,
          userId: targetUserId,
        },
      },
      data: {
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
