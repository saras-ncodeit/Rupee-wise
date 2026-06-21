import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HouseholdRoleGuard } from './guards/household-role.guard';
import { RequireRoles } from './decorators/require-roles.decorator';
import { HouseholdsService } from './households.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Request } from 'express';

@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  async create(@Body() dto: CreateHouseholdDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.householdsService.create(user.id, dto);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.householdsService.findAllForUser(user.id);
  }

  @Get(':householdId')
  @UseGuards(HouseholdRoleGuard)
  async findOne(@Param('householdId') householdId: string) {
    return this.householdsService.findOne(householdId);
  }

  @Post(':householdId/members')
  @UseGuards(HouseholdRoleGuard)
  @RequireRoles('owner', 'co_owner')
  async invite(
    @Param('householdId') householdId: string,
    @Body() dto: InviteMemberDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.householdsService.invite(householdId, dto, user.id);
  }

  @Delete(':householdId/members/:userId')
  @UseGuards(HouseholdRoleGuard)
  async removeMember(
    @Param('householdId') householdId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.householdsService.removeMember(householdId, userId, user.id);
  }

  @Patch(':householdId/members/:userId')
  @UseGuards(HouseholdRoleGuard)
  @RequireRoles('owner', 'co_owner')
  async updateMemberRole(
    @Param('householdId') householdId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.householdsService.updateMemberRole(householdId, userId, dto, user.id);
  }
}
