import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HouseholdRoleGuard } from '../households/guards/household-role.guard';
import { RequireRoles } from '../households/decorators/require-roles.decorator';
import { BudgetsService } from './budgets.service';
import { SetBudgetDto } from './dto/set-budget.dto';
import { SetBudgetLinesDto } from './dto/set-budget-lines.dto';
import { CopyBudgetDto } from './dto/copy-budget.dto';
import { Request } from 'express';

@Controller('households/:householdId/budgets')
@UseGuards(JwtAuthGuard, HouseholdRoleGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @RequireRoles('owner', 'co_owner', 'member')
  async setBudget(
    @Param('householdId') householdId: string,
    @Body() dto: SetBudgetDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.budgetsService.setBudget(householdId, user.id, dto);
  }

  @Post(':month/lines')
  @RequireRoles('owner', 'co_owner', 'member')
  async setBudgetLines(
    @Param('householdId') householdId: string,
    @Param('month') month: string,
    @Body() dto: SetBudgetLinesDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.budgetsService.setBudgetLines(householdId, month, dto, user.id);
  }

  @Get(':month')
  async getBudgetDetails(
    @Param('householdId') householdId: string,
    @Param('month') month: string,
  ) {
    return this.budgetsService.getBudgetDetails(householdId, month);
  }

  @Post('copy')
  @RequireRoles('owner', 'co_owner', 'member')
  async copyBudget(
    @Param('householdId') householdId: string,
    @Body() dto: CopyBudgetDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.budgetsService.copyBudget(householdId, user.id, dto.sourceMonth, dto.targetMonth);
  }

  @Get('aggregations/trends')
  async getAggregations(
    @Param('householdId') householdId: string,
    @Query('timeframe') timeframe?: 'weekly' | 'monthly' | 'yearly',
    @Query('yearType') yearType?: 'calendar' | 'financial',
    @Query('year') year?: number,
  ) {
    const selectedTimeframe = timeframe || 'monthly';
    const selectedYearType = yearType || 'calendar';
    const selectedYear = year ? Number(year) : new Date().getUTCFullYear();

    return this.budgetsService.getAggregations(
      householdId,
      selectedTimeframe,
      selectedYearType,
      selectedYear,
    );
  }
}
