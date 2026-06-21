import { PrismaService } from '../prisma/prisma.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
export declare class HouseholdsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateHouseholdDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        timezone: string;
        currency: string;
        updatedAt: Date;
        plan: string;
        createdBy: string;
    }>;
    findAllForUser(userId: string): Promise<{
        userRole: string;
        members: ({
            user: {
                id: string;
                email: string;
                fullName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            householdId: string;
            role: string;
            userId: string;
            displayName: string | null;
            joinedAt: Date;
            invitedBy: string | null;
        })[];
        id: string;
        name: string;
        createdAt: Date;
        timezone: string;
        currency: string;
        updatedAt: Date;
        plan: string;
        createdBy: string;
    }[]>;
    findOne(householdId: string): Promise<{
        members: ({
            user: {
                id: string;
                email: string;
                fullName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            householdId: string;
            role: string;
            userId: string;
            displayName: string | null;
            joinedAt: Date;
            invitedBy: string | null;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        timezone: string;
        currency: string;
        updatedAt: Date;
        plan: string;
        createdBy: string;
    }>;
    invite(householdId: string, dto: InviteMemberDto, invitedBy: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        householdId: string;
        role: string;
        userId: string;
        displayName: string | null;
        joinedAt: Date;
        invitedBy: string | null;
    }>;
    removeMember(householdId: string, targetUserId: string, operatorUserId: string): Promise<{
        id: string;
        householdId: string;
        role: string;
        userId: string;
        displayName: string | null;
        joinedAt: Date;
        invitedBy: string | null;
    }>;
    updateMemberRole(householdId: string, targetUserId: string, dto: UpdateMemberRoleDto, operatorUserId: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        householdId: string;
        role: string;
        userId: string;
        displayName: string | null;
        joinedAt: Date;
        invitedBy: string | null;
    }>;
}
