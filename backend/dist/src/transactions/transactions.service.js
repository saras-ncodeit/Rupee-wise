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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransactionsService = class TransactionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    validateSplits(amount, splits) {
        if (!splits || splits.length === 0)
            return;
        const splitsSum = splits.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(splitsSum - amount) > 0.001) {
            throw new common_1.BadRequestException(`Sum of splits (${splitsSum}) must equal transaction amount (${amount})`);
        }
    }
    async create(householdId, userId, dto) {
        if (dto.type === 'transfer' && !dto.transferToAccountId) {
            throw new common_1.BadRequestException('Transfer transactions require a destination account (transferToAccountId)');
        }
        if (dto.type === 'transfer' && dto.accountId === dto.transferToAccountId) {
            throw new common_1.BadRequestException('Source and destination accounts must be different for transfer transactions');
        }
        this.validateSplits(dto.amount, dto.splits);
        const account = await this.prisma.account.findFirst({
            where: { id: dto.accountId, householdId },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Source account not found in this household`);
        }
        let transferAccount = null;
        if (dto.type === 'transfer') {
            transferAccount = await this.prisma.account.findFirst({
                where: { id: dto.transferToAccountId, householdId },
            });
            if (!transferAccount) {
                throw new common_1.NotFoundException(`Destination account not found in this household`);
            }
        }
        if (dto.categoryId) {
            const category = await this.prisma.category.findFirst({
                where: {
                    id: dto.categoryId,
                    OR: [{ householdId }, { isSystem: true }],
                },
            });
            if (!category) {
                throw new common_1.NotFoundException('Category not found');
            }
        }
        const exchangeRate = dto.exchangeRate ?? 1.0;
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    householdId,
                    accountId: dto.accountId,
                    categoryId: dto.categoryId,
                    createdBy: userId,
                    type: dto.type,
                    amount: dto.amount,
                    currency: dto.currency || 'INR',
                    exchangeRate,
                    date: new Date(dto.date),
                    description: dto.description,
                    notes: dto.notes,
                    transferToAccountId: dto.transferToAccountId,
                    isReimbursable: dto.isReimbursable ?? false,
                    loanId: dto.loanId,
                    billId: dto.billId,
                    investmentId: dto.investmentId,
                },
            });
            if (dto.type === 'income') {
                await tx.account.update({
                    where: { id: dto.accountId },
                    data: { currentBalance: { increment: dto.amount } },
                });
            }
            else if (dto.type === 'expense') {
                await tx.account.update({
                    where: { id: dto.accountId },
                    data: { currentBalance: { decrement: dto.amount } },
                });
            }
            else if (dto.type === 'transfer') {
                await tx.account.update({
                    where: { id: dto.accountId },
                    data: { currentBalance: { decrement: dto.amount } },
                });
                const destinationAmount = dto.amount * exchangeRate;
                await tx.account.update({
                    where: { id: dto.transferToAccountId },
                    data: { currentBalance: { increment: destinationAmount } },
                });
            }
            if (dto.splits && dto.splits.length > 0) {
                await tx.transactionSplit.createMany({
                    data: dto.splits.map((s) => ({
                        transactionId: transaction.id,
                        categoryId: s.categoryId,
                        amount: s.amount,
                        notes: s.notes,
                    })),
                });
            }
            if (dto.tags && dto.tags.length > 0) {
                for (const tagName of dto.tags) {
                    const formattedName = tagName.trim().toLowerCase();
                    if (!formattedName)
                        continue;
                    let tag = await tx.tag.findFirst({
                        where: { householdId, name: formattedName },
                    });
                    if (!tag) {
                        tag = await tx.tag.create({
                            data: {
                                householdId,
                                name: formattedName,
                            },
                        });
                    }
                    await tx.transactionTag.create({
                        data: {
                            transactionId: transaction.id,
                            tagId: tag.id,
                        },
                    });
                }
            }
            return tx.transaction.findUnique({
                where: { id: transaction.id },
                include: {
                    splits: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            });
        });
    }
    async findAll(householdId, filters) {
        const where = {
            householdId,
            deletedAt: null,
        };
        if (filters.accountId) {
            where.OR = [
                { accountId: filters.accountId },
                { transferToAccountId: filters.accountId },
            ];
        }
        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) {
                where.date.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.date.lte = new Date(filters.endDate);
            }
        }
        if (filters.search) {
            where.OR = [
                { description: { contains: filters.search } },
                { notes: { contains: filters.search } },
            ];
        }
        const limit = filters.limit ? Number(filters.limit) : 50;
        const offset = filters.offset ? Number(filters.offset) : 0;
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { date: 'desc' },
                include: {
                    account: true,
                    transferToAccount: true,
                    category: true,
                    splits: {
                        include: {
                            category: true,
                        },
                    },
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            }),
            this.prisma.transaction.count({ where }),
        ]);
        return {
            transactions,
            total,
            limit,
            offset,
        };
    }
    async findOne(householdId, id) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, householdId, deletedAt: null },
            include: {
                account: true,
                transferToAccount: true,
                category: true,
                splits: {
                    include: {
                        category: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found in this household');
        }
        return transaction;
    }
    async remove(householdId, id) {
        const txData = await this.findOne(householdId, id);
        const amount = Number(txData.amount);
        const exchangeRate = Number(txData.exchangeRate);
        return this.prisma.$transaction(async (tx) => {
            if (txData.type === 'income') {
                await tx.account.update({
                    where: { id: txData.accountId },
                    data: { currentBalance: { decrement: amount } },
                });
            }
            else if (txData.type === 'expense') {
                await tx.account.update({
                    where: { id: txData.accountId },
                    data: { currentBalance: { increment: amount } },
                });
            }
            else if (txData.type === 'transfer') {
                await tx.account.update({
                    where: { id: txData.accountId },
                    data: { currentBalance: { increment: amount } },
                });
                const destAmount = amount * exchangeRate;
                if (txData.transferToAccountId) {
                    await tx.account.update({
                        where: { id: txData.transferToAccountId },
                        data: { currentBalance: { decrement: destAmount } },
                    });
                }
            }
            return tx.transaction.delete({
                where: { id },
            });
        });
    }
    async update(householdId, id, dto, userId) {
        const existing = await this.findOne(householdId, id);
        const newAccountId = dto.accountId ?? existing.accountId;
        const newTransferToAccountId = dto.transferToAccountId ?? existing.transferToAccountId;
        const newCategoryId = dto.categoryId !== undefined ? dto.categoryId : existing.categoryId;
        const newType = dto.type ?? existing.type;
        const newAmount = dto.amount ?? Number(existing.amount);
        const newExchangeRate = dto.exchangeRate ?? Number(existing.exchangeRate);
        const newDate = dto.date ? new Date(dto.date) : existing.date;
        const newDescription = dto.description !== undefined ? dto.description : existing.description;
        const newNotes = dto.notes !== undefined ? dto.notes : existing.notes;
        const newIsReimbursable = dto.isReimbursable ?? existing.isReimbursable;
        const newLoanId = dto.loanId !== undefined ? dto.loanId : existing.loanId;
        const newBillId = dto.billId !== undefined ? dto.billId : existing.billId;
        const newInvestmentId = dto.investmentId !== undefined ? dto.investmentId : existing.investmentId;
        if (newType === 'transfer' && !newTransferToAccountId) {
            throw new common_1.BadRequestException('Transfer transactions require a destination account (transferToAccountId)');
        }
        if (newType === 'transfer' && newAccountId === newTransferToAccountId) {
            throw new common_1.BadRequestException('Source and destination accounts must be different for transfer transactions');
        }
        if (dto.splits) {
            this.validateSplits(newAmount, dto.splits);
        }
        const acc = await this.prisma.account.findFirst({
            where: { id: newAccountId, householdId },
        });
        if (!acc) {
            throw new common_1.NotFoundException(`Source account not found in this household`);
        }
        if (newType === 'transfer') {
            if (!newTransferToAccountId) {
                throw new common_1.BadRequestException('Transfer transactions require a destination account');
            }
            const destAcc = await this.prisma.account.findFirst({
                where: { id: newTransferToAccountId, householdId },
            });
            if (!destAcc) {
                throw new common_1.NotFoundException(`Destination account not found in this household`);
            }
        }
        if (newCategoryId) {
            const cat = await this.prisma.category.findFirst({
                where: {
                    id: newCategoryId,
                    OR: [{ householdId }, { isSystem: true }],
                },
            });
            if (!cat) {
                throw new common_1.NotFoundException('Category not found');
            }
        }
        return this.prisma.$transaction(async (tx) => {
            const oldAmount = Number(existing.amount);
            const oldExchange = Number(existing.exchangeRate);
            if (existing.type === 'income') {
                await tx.account.update({
                    where: { id: existing.accountId },
                    data: { currentBalance: { decrement: oldAmount } },
                });
            }
            else if (existing.type === 'expense') {
                await tx.account.update({
                    where: { id: existing.accountId },
                    data: { currentBalance: { increment: oldAmount } },
                });
            }
            else if (existing.type === 'transfer') {
                await tx.account.update({
                    where: { id: existing.accountId },
                    data: { currentBalance: { increment: oldAmount } },
                });
                if (existing.transferToAccountId) {
                    await tx.account.update({
                        where: { id: existing.transferToAccountId },
                        data: { currentBalance: { decrement: oldAmount * oldExchange } },
                    });
                }
            }
            if (newType === 'income') {
                await tx.account.update({
                    where: { id: newAccountId },
                    data: { currentBalance: { increment: newAmount } },
                });
            }
            else if (newType === 'expense') {
                await tx.account.update({
                    where: { id: newAccountId },
                    data: { currentBalance: { decrement: newAmount } },
                });
            }
            else if (newType === 'transfer') {
                await tx.account.update({
                    where: { id: newAccountId },
                    data: { currentBalance: { decrement: newAmount } },
                });
                if (newTransferToAccountId) {
                    await tx.account.update({
                        where: { id: newTransferToAccountId },
                        data: { currentBalance: { increment: newAmount * newExchangeRate } },
                    });
                }
            }
            if (dto.splits) {
                await tx.transactionSplit.deleteMany({
                    where: { transactionId: id },
                });
                if (dto.splits.length > 0) {
                    await tx.transactionSplit.createMany({
                        data: dto.splits.map((s) => ({
                            transactionId: id,
                            categoryId: s.categoryId,
                            amount: s.amount,
                            notes: s.notes,
                        })),
                    });
                }
            }
            if (dto.tags) {
                await tx.transactionTag.deleteMany({
                    where: { transactionId: id },
                });
                for (const tagName of dto.tags) {
                    const formattedName = tagName.trim().toLowerCase();
                    if (!formattedName)
                        continue;
                    let tag = await tx.tag.findFirst({
                        where: { householdId, name: formattedName },
                    });
                    if (!tag) {
                        tag = await tx.tag.create({
                            data: {
                                householdId,
                                name: formattedName,
                            },
                        });
                    }
                    await tx.transactionTag.create({
                        data: {
                            transactionId: id,
                            tagId: tag.id,
                        },
                    });
                }
            }
            return tx.transaction.update({
                where: { id },
                data: {
                    accountId: newAccountId,
                    categoryId: newCategoryId,
                    type: newType,
                    amount: newAmount,
                    currency: dto.currency ?? existing.currency,
                    exchangeRate: newExchangeRate,
                    date: newDate,
                    description: newDescription,
                    notes: newNotes,
                    transferToAccountId: newType === 'transfer' ? newTransferToAccountId : null,
                    isReimbursable: newIsReimbursable,
                    loanId: newLoanId,
                    billId: newBillId,
                    investmentId: newInvestmentId,
                },
                include: {
                    splits: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            });
        });
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map