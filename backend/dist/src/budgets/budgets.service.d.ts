import { PrismaService } from '../prisma/prisma.service';
import { SetBudgetDto } from './dto/set-budget.dto';
import { SetBudgetLinesDto } from './dto/set-budget-lines.dto';
export declare class BudgetsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseMonth;
    setBudget(householdId: string, userId: string, dto: SetBudgetDto): Promise<{
        id: string;
        householdId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        notes: string | null;
        month: Date;
        totalIncomeBudget: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    setBudgetLines(householdId: string, monthStr: string, dto: SetBudgetLinesDto, userId: string): Promise<({
        lines: ({
            category: {
                id: string;
                householdId: string | null;
                parentId: string | null;
                name: string;
                type: string;
                icon: string | null;
                color: string | null;
                isSystem: boolean;
                isArchived: boolean;
                sortOrder: number;
                createdAt: Date;
            };
        } & {
            id: string;
            categoryId: string;
            plannedAmount: import("@prisma/client/runtime/library").Decimal;
            rolloverAmount: import("@prisma/client/runtime/library").Decimal;
            isPercentage: boolean;
            percentageValue: import("@prisma/client/runtime/library").Decimal | null;
            alertAtPct: number;
            weeklyOverride: import("@prisma/client/runtime/library").Decimal | null;
            budgetId: string;
        })[];
    } & {
        id: string;
        householdId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        notes: string | null;
        month: Date;
        totalIncomeBudget: import("@prisma/client/runtime/library").Decimal | null;
    }) | null>;
    getBudgetDetails(householdId: string, monthStr: string): Promise<{
        budgetId: string | null;
        month: string;
        totalIncomeBudget: number;
        notes: string | null;
        lines: {
            id: string | null;
            categoryId: string;
            category: {
                id: string;
                householdId: string | null;
                parentId: string | null;
                name: string;
                type: string;
                icon: string | null;
                color: string | null;
                isSystem: boolean;
                isArchived: boolean;
                sortOrder: number;
                createdAt: Date;
            };
            plannedAmount: number;
            rolloverAmount: number;
            isPercentage: boolean;
            percentageValue: number;
            alertAtPct: number;
            weeklyOverride: number | null;
            actualSpent: number;
        }[];
    }>;
    copyBudget(householdId: string, userId: string, sourceMonth: string, targetMonth: string): Promise<({
        lines: ({
            category: {
                id: string;
                householdId: string | null;
                parentId: string | null;
                name: string;
                type: string;
                icon: string | null;
                color: string | null;
                isSystem: boolean;
                isArchived: boolean;
                sortOrder: number;
                createdAt: Date;
            };
        } & {
            id: string;
            categoryId: string;
            plannedAmount: import("@prisma/client/runtime/library").Decimal;
            rolloverAmount: import("@prisma/client/runtime/library").Decimal;
            isPercentage: boolean;
            percentageValue: import("@prisma/client/runtime/library").Decimal | null;
            alertAtPct: number;
            weeklyOverride: import("@prisma/client/runtime/library").Decimal | null;
            budgetId: string;
        })[];
    } & {
        id: string;
        householdId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        notes: string | null;
        month: Date;
        totalIncomeBudget: import("@prisma/client/runtime/library").Decimal | null;
    }) | null>;
    getAggregations(householdId: string, timeframe: 'weekly' | 'monthly' | 'yearly', yearType: 'calendar' | 'financial', year: number): Promise<{
        period: string;
        income: number;
        expense: number;
        savings: number;
    }[]>;
}
