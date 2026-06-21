import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HouseholdRoleGuard } from '../households/guards/household-role.guard';
import { RequireRoles } from '../households/decorators/require-roles.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';
import { Request } from 'express';

@Controller('households/:householdId/transactions')
@UseGuards(JwtAuthGuard, HouseholdRoleGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @RequireRoles('owner', 'co_owner', 'member')
  async create(
    @Param('householdId') householdId: string,
    @Body() dto: CreateTransactionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.transactionsService.create(householdId, user.id, dto);
  }

  @Get()
  async findAll(
    @Param('householdId') householdId: string,
    @Query('accountId') accountId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.transactionsService.findAll(householdId, {
      accountId,
      categoryId,
      startDate,
      endDate,
      search,
      type,
      limit,
      offset,
    });
  }

  @Get(':transactionId')
  async findOne(
    @Param('householdId') householdId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.transactionsService.findOne(householdId, transactionId);
  }

  @Patch(':transactionId')
  @UseInterceptors(IdempotencyInterceptor)
  @RequireRoles('owner', 'co_owner', 'member')
  async update(
    @Param('householdId') householdId: string,
    @Param('transactionId') transactionId: string,
    @Body() dto: UpdateTransactionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.transactionsService.update(householdId, transactionId, dto, user.id);
  }

  @Delete(':transactionId')
  @RequireRoles('owner', 'co_owner', 'member')
  async remove(
    @Param('householdId') householdId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.transactionsService.remove(householdId, transactionId);
  }
}
