import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetBudgetDto } from './dto/set-budget.dto';
import { SetBudgetLinesDto } from './dto/set-budget-lines.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseMonth(monthStr: string): Date {
    const parts = monthStr.split('-');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid month format. Expected YYYY-MM');
    }
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid month values');
    }
    return new Date(Date.UTC(year, month - 1, 1));
  }

  async setBudget(householdId: string, userId: string, dto: SetBudgetDto) {
    const monthDate = this.parseMonth(dto.month);

    return this.prisma.budget.upsert({
      where: {
        householdId_month: {
          householdId,
          month: monthDate,
        },
      },
      update: {
        totalIncomeBudget: dto.totalIncomeBudget !== undefined ? dto.totalIncomeBudget : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
      create: {
        householdId,
        month: monthDate,
        totalIncomeBudget: dto.totalIncomeBudget ?? 0,
        notes: dto.notes,
        createdBy: userId,
      },
    });
  }

  async setBudgetLines(householdId: string, monthStr: string, dto: SetBudgetLinesDto, userId: string) {
    const monthDate = this.parseMonth(monthStr);

    let budget = await this.prisma.budget.findUnique({
      where: {
        householdId_month: {
          householdId,
          month: monthDate,
        },
      },
    });

    if (!budget) {
      // Auto-create budget wrapper if it doesn't exist yet
      budget = await this.prisma.budget.create({
        data: {
          householdId,
          month: monthDate,
          totalIncomeBudget: 0,
          createdBy: userId,
        },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // Clear existing lines
      await tx.budgetLine.deleteMany({
        where: { budgetId: budget.id },
      });

      // Insert new lines
      if (dto.lines.length > 0) {
        await tx.budgetLine.createMany({
          data: dto.lines.map((l) => ({
            budgetId: budget.id,
            categoryId: l.categoryId,
            plannedAmount: l.plannedAmount,
            rolloverAmount: l.rolloverAmount ?? 0,
            isPercentage: l.isPercentage ?? false,
            percentageValue: l.percentageValue ?? 0,
            alertAtPct: l.alertAtPct ?? 80,
            weeklyOverride: l.weeklyOverride,
          })),
        });
      }

      return tx.budget.findUnique({
        where: { id: budget.id },
        include: {
          lines: {
            include: {
              category: true,
            },
          },
        },
      });
    });
  }

  async getBudgetDetails(householdId: string, monthStr: string) {
    const monthDate = this.parseMonth(monthStr);

    // Get budget (if it exists)
    const budget = await this.prisma.budget.findUnique({
      where: {
        householdId_month: {
          householdId,
          month: monthDate,
        },
      },
      include: {
        lines: true,
      },
    });

    // Fetch categories
    const categories = await this.prisma.category.findMany({
      where: {
        OR: [{ householdId }, { isSystem: true }],
        isArchived: false,
      },
    });

    // Calculate actual spent for this month
    const start = monthDate;
    const end = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1));

    const transactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: start, lt: end },
        deletedAt: null,
      },
      include: {
        splits: true,
      },
    });

    const actualsMap = new Map<string, number>();
    for (const tx of transactions) {
      // Exclude transfers from category budget tracking
      if (tx.type === 'transfer') continue;

      if (tx.splits && tx.splits.length > 0) {
        for (const s of tx.splits) {
          actualsMap.set(s.categoryId, (actualsMap.get(s.categoryId) || 0) + Number(s.amount));
        }
      } else if (tx.categoryId) {
        actualsMap.set(tx.categoryId, (actualsMap.get(tx.categoryId) || 0) + Number(tx.amount));
      }
    }

    // Merge categories with budget lines and actuals
    const lines = categories.map((cat) => {
      const line = budget?.lines.find((l) => l.categoryId === cat.id);
      const actualSpent = actualsMap.get(cat.id) || 0;

      return {
        id: line?.id || null,
        categoryId: cat.id,
        category: cat,
        plannedAmount: line ? Number(line.plannedAmount) : 0,
        rolloverAmount: line ? Number(line.rolloverAmount) : 0,
        isPercentage: line ? line.isPercentage : false,
        percentageValue: line ? Number(line.percentageValue) : 0,
        alertAtPct: line ? line.alertAtPct : 80,
        weeklyOverride: line && line.weeklyOverride ? Number(line.weeklyOverride) : null,
        actualSpent,
      };
    });

    return {
      budgetId: budget?.id || null,
      month: monthStr,
      totalIncomeBudget: budget ? Number(budget.totalIncomeBudget) : 0,
      notes: budget?.notes || null,
      lines,
    };
  }

  async copyBudget(householdId: string, userId: string, sourceMonth: string, targetMonth: string) {
    const sourceDate = this.parseMonth(sourceMonth);
    const targetDate = this.parseMonth(targetMonth);

    const sourceBudget = await this.prisma.budget.findUnique({
      where: {
        householdId_month: {
          householdId,
          month: sourceDate,
        },
      },
      include: {
        lines: true,
      },
    });

    if (!sourceBudget) {
      throw new NotFoundException(`Source budget for month ${sourceMonth} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert target budget wrapper
      const targetBudget = await tx.budget.upsert({
        where: {
          householdId_month: {
            householdId,
            month: targetDate,
          },
        },
        update: {
          totalIncomeBudget: sourceBudget.totalIncomeBudget,
        },
        create: {
          householdId,
          month: targetDate,
          totalIncomeBudget: sourceBudget.totalIncomeBudget ?? 0,
          createdBy: userId,
        },
      });

      // 2. Delete existing target lines
      await tx.budgetLine.deleteMany({
        where: { budgetId: targetBudget.id },
      });

      // 3. Create copied lines
      if (sourceBudget.lines.length > 0) {
        await tx.budgetLine.createMany({
          data: sourceBudget.lines.map((l) => ({
            budgetId: targetBudget.id,
            categoryId: l.categoryId,
            plannedAmount: l.plannedAmount,
            rolloverAmount: l.rolloverAmount,
            isPercentage: l.isPercentage,
            percentageValue: l.percentageValue,
            alertAtPct: l.alertAtPct,
            weeklyOverride: l.weeklyOverride,
          })),
        });
      }

      return tx.budget.findUnique({
        where: { id: targetBudget.id },
        include: {
          lines: {
            include: {
              category: true,
            },
          },
        },
      });
    });
  }

  async getAggregations(
    householdId: string,
    timeframe: 'weekly' | 'monthly' | 'yearly',
    yearType: 'calendar' | 'financial',
    year: number,
  ) {
    let start: Date;
    let end: Date;

    if (yearType === 'calendar') {
      start = new Date(Date.UTC(year, 0, 1));
      end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    } else {
      // Indian Financial Year: April 1st of "year" to March 31st of "year + 1"
      start = new Date(Date.UTC(year, 3, 1));
      end = new Date(Date.UTC(year + 1, 2, 31, 23, 59, 59, 999));
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: start, lte: end },
        deletedAt: null,
      },
      include: {
        splits: true,
      },
    });

    // Process in JS
    const result: Record<string, { income: number; expense: number }> = {};

    for (const tx of transactions) {
      if (tx.type === 'transfer') continue; // Skip transfers in aggregations

      let groupingKey = '';
      const date = new Date(tx.date);

      if (timeframe === 'monthly') {
        const monthNum = date.getUTCMonth() + 1;
        groupingKey = `${date.getUTCFullYear()}-${monthNum.toString().padStart(2, '0')}`;
      } else if (timeframe === 'weekly') {
        // Find week of the year
        const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const diff = date.getTime() - startOfYear.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        const weekNum = Math.ceil((dayOfYear + startOfYear.getUTCDay() + 1) / 7);
        groupingKey = `${date.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      } else {
        groupingKey = `${date.getUTCFullYear()}`;
      }

      if (!result[groupingKey]) {
        result[groupingKey] = { income: 0, expense: 0 };
      }

      const txAmount = Number(tx.amount);
      const isIncome = tx.type === 'income';

      if (tx.splits && tx.splits.length > 0) {
        const splitAmount = tx.splits.reduce((sum, s) => sum + Number(s.amount), 0);
        if (isIncome) {
          result[groupingKey].income += splitAmount;
        } else {
          result[groupingKey].expense += splitAmount;
        }
      } else {
        if (isIncome) {
          result[groupingKey].income += txAmount;
        } else {
          result[groupingKey].expense += txAmount;
        }
      }
    }

    return Object.keys(result)
      .sort()
      .map((key) => ({
        period: key,
        income: result[key].income,
        expense: result[key].expense,
        savings: result[key].income - result[key].expense,
      }));
  }
}
