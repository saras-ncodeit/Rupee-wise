import { HouseholdsService } from './households.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Request } from 'express';
export declare class HouseholdsController {
    private readonly householdsService;
    constructor(householdsService: HouseholdsService);
    create(dto: CreateHouseholdDto, req: Request): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        timezone: string;
        currency: string;
        updatedAt: Date;
        plan: string;
        createdBy: string;
    }>;
    findAll(req: Request): Promise<{
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
    invite(householdId: string, dto: InviteMemberDto, req: Request): Promise<{
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
    removeMember(householdId: string, userId: string, req: Request): Promise<{
        id: string;
        householdId: string;
        role: string;
        userId: string;
        displayName: string | null;
        joinedAt: Date;
        invitedBy: string | null;
    }>;
    updateMemberRole(householdId: string, userId: string, dto: UpdateMemberRoleDto, req: Request): Promise<{
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
