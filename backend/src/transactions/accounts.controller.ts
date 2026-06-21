import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HouseholdRoleGuard } from '../households/guards/household-role.guard';
import { RequireRoles } from '../households/decorators/require-roles.decorator';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('households/:householdId/accounts')
@UseGuards(JwtAuthGuard, HouseholdRoleGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @RequireRoles('owner', 'co_owner', 'member')
  async create(
    @Param('householdId') householdId: string,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountsService.create(householdId, dto);
  }

  @Get()
  async findAll(@Param('householdId') householdId: string) {
    return this.accountsService.findAll(householdId);
  }

  @Get(':accountId')
  async findOne(
    @Param('householdId') householdId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.accountsService.findOne(householdId, accountId);
  }

  @Patch(':accountId')
  @RequireRoles('owner', 'co_owner', 'member')
  async update(
    @Param('householdId') householdId: string,
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(householdId, accountId, dto);
  }

  @Delete(':accountId')
  @RequireRoles('owner', 'co_owner', 'member')
  async remove(
    @Param('householdId') householdId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.accountsService.remove(householdId, accountId);
  }
}
