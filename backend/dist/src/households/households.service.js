"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let HouseholdsService = class HouseholdsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const household = await tx.household.create({
                data: {
                    name: dto.name,
                    currency: dto.currency || 'INR',
                    timezone: dto.timezone || 'Asia/Kolkata',
                    createdBy: userId,
                },
            });
            await tx.householdMember.create({
                data: {
                    householdId: household.id,
                    userId,
                    role: 'owner',
                    displayName: null,
                },
            });
            return household;
        });
    }
    async findAllForUser(userId) {
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
    async findOne(householdId) {
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
            throw new common_1.NotFoundException('Household not found');
        }
        return household;
    }
    async invite(householdId, dto, invitedBy) {
        const userToInvite = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (!userToInvite) {
            throw new common_1.NotFoundException('User with this email address is not registered');
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
            throw new common_1.ConflictException('User is already a member of this household');
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
    async removeMember(householdId, targetUserId, operatorUserId) {
        const targetMember = await this.prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId: targetUserId,
                },
            },
        });
        if (!targetMember) {
            throw new common_1.NotFoundException('Member not found in this household');
        }
        if (targetMember.role === 'owner') {
            throw new common_1.BadRequestException('Cannot remove the household owner. The owner must transfer ownership first or delete the household.');
        }
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
                throw new common_1.ForbiddenException('Operator is not a member of this household');
            }
            if (operatorMember.role !== 'owner' && operatorMember.role !== 'co_owner') {
                throw new common_1.ForbiddenException('Only owners and co-owners can remove household members');
            }
            if (operatorMember.role === 'co_owner' && targetMember.role === 'co_owner') {
                throw new common_1.ForbiddenException('Co-owners cannot remove other co-owners');
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
    async updateMemberRole(householdId, targetUserId, dto, operatorUserId) {
        const targetMember = await this.prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId: targetUserId,
                },
            },
        });
        if (!targetMember) {
            throw new common_1.NotFoundException('Member not found in this household');
        }
        if (targetMember.role === 'owner') {
            throw new common_1.BadRequestException('Cannot modify the role of the household owner.');
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
            throw new common_1.ForbiddenException('Operator is not a member of this household');
        }
        if (operatorMember.role !== 'owner' && operatorMember.role !== 'co_owner') {
            throw new common_1.ForbiddenException('Only owners and co-owners can update member roles');
        }
        if (operatorMember.role === 'co_owner') {
            if (targetMember.role === 'co_owner') {
                throw new common_1.ForbiddenException('Co-owners cannot modify roles of other co-owners');
            }
            if (dto.role === 'co_owner') {
                throw new common_1.ForbiddenException('Co-owners cannot promote members to co-owner');
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
};
exports.HouseholdsService = HouseholdsService;
exports.HouseholdsService = HouseholdsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HouseholdsService);
//# sourceMappingURL=households.service.js.map