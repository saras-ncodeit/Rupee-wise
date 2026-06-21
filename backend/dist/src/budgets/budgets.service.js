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
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BudgetsService = class BudgetsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    parseMonth(monthStr) {
        const parts = monthStr.split('-');
        if (parts.length !== 2) {
            throw new common_1.BadRequestException('Invalid month format. Expected YYYY-MM');
        }
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            throw new common_1.BadRequestException('Invalid month values');
        }
        return new Date(Date.UTC(year, month - 1, 1));
    }
    async setBudget(householdId, userId, dto) {
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
    async setBudgetLines(householdId, monthStr, dto, userId) {
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
            await tx.budgetLine.deleteMany({
                where: { budgetId: budget.id },
            });
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
    async getBudgetDetails(householdId, monthStr) {
        const monthDate = this.parseMonth(monthStr);
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
        const categories = await this.prisma.category.findMany({
            where: {
                OR: [{ householdId }, { isSystem: true }],
                isArchived: false,
            },
        });
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
        const actualsMap = new Map();
        for (const tx of transactions) {
            if (tx.type === 'transfer')
                continue;
            if (tx.splits && tx.splits.length > 0) {
                for (const s of tx.splits) {
                    actualsMap.set(s.categoryId, (actualsMap.get(s.categoryId) || 0) + Number(s.amount));
                }
            }
            else if (tx.categoryId) {
                actualsMap.set(tx.categoryId, (actualsMap.get(tx.categoryId) || 0) + Number(tx.amount));
            }
        }
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
    async copyBudget(householdId, userId, sourceMonth, targetMonth) {
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
            throw new common_1.NotFoundException(`Source budget for month ${sourceMonth} not found`);
        }
        return this.prisma.$transaction(async (tx) => {
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
            await tx.budgetLine.deleteMany({
                where: { budgetId: targetBudget.id },
            });
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
    async getAggregations(householdId, timeframe, yearType, year) {
        let start;
        let end;
        if (yearType === 'calendar') {
            start = new Date(Date.UTC(year, 0, 1));
            end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        }
        else {
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
        const result = {};
        for (const tx of transactions) {
            if (tx.type === 'transfer')
                continue;
            let groupingKey = '';
            const date = new Date(tx.date);
            if (timeframe === 'monthly') {
                const monthNum = date.getUTCMonth() + 1;
                groupingKey = `${date.getUTCFullYear()}-${monthNum.toString().padStart(2, '0')}`;
            }
            else if (timeframe === 'weekly') {
                const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
                const diff = date.getTime() - startOfYear.getTime();
                const oneDay = 1000 * 60 * 60 * 24;
                const dayOfYear = Math.floor(diff / oneDay);
                const weekNum = Math.ceil((dayOfYear + startOfYear.getUTCDay() + 1) / 7);
                groupingKey = `${date.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
            }
            else {
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
                }
                else {
                    result[groupingKey].expense += splitAmount;
                }
            }
            else {
                if (isIncome) {
                    result[groupingKey].income += txAmount;
                }
                else {
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
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map