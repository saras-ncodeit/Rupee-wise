import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateSplits(amount: number, splits?: { amount: number }[]) {
    if (!splits || splits.length === 0) return;
    const splitsSum = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitsSum - amount) > 0.001) {
      throw new BadRequestException(`Sum of splits (${splitsSum}) must equal transaction amount (${amount})`);
    }
  }

  async create(householdId: string, userId: string, dto: CreateTransactionDto) {
    // 1. Validations
    if (dto.type === 'transfer' && !dto.transferToAccountId) {
      throw new BadRequestException('Transfer transactions require a destination account (transferToAccountId)');
    }

    if (dto.type === 'transfer' && dto.accountId === dto.transferToAccountId) {
      throw new BadRequestException('Source and destination accounts must be different for transfer transactions');
    }

    this.validateSplits(dto.amount, dto.splits);

    // Verify account exists in household
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, householdId },
    });
    if (!account) {
      throw new NotFoundException(`Source account not found in this household`);
    }

    let transferAccount = null;
    if (dto.type === 'transfer') {
      transferAccount = await this.prisma.account.findFirst({
        where: { id: dto.transferToAccountId, householdId },
      });
      if (!transferAccount) {
        throw new NotFoundException(`Destination account not found in this household`);
      }
    }

    // Verify category belongs to household or is system-wide
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          OR: [{ householdId }, { isSystem: true }],
        },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const exchangeRate = dto.exchangeRate ?? 1.0;

    return this.prisma.$transaction(async (tx) => {
      // 2. Create the main transaction
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

      // 3. Update account balances
      if (dto.type === 'income') {
        await tx.account.update({
          where: { id: dto.accountId },
          data: { currentBalance: { increment: dto.amount } },
        });
      } else if (dto.type === 'expense') {
        await tx.account.update({
          where: { id: dto.accountId },
          data: { currentBalance: { decrement: dto.amount } },
        });
      } else if (dto.type === 'transfer') {
        // Decrement source
        await tx.account.update({
          where: { id: dto.accountId },
          data: { currentBalance: { decrement: dto.amount } },
        });
        // Increment destination
        const destinationAmount = dto.amount * exchangeRate;
        await tx.account.update({
          where: { id: dto.transferToAccountId },
          data: { currentBalance: { increment: destinationAmount } },
        });
      }

      // 4. Create splits if any
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

      // 5. Handle tags
      if (dto.tags && dto.tags.length > 0) {
        for (const tagName of dto.tags) {
          const formattedName = tagName.trim().toLowerCase();
          if (!formattedName) continue;

          // Find or create tag
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

          // Link to transaction
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

  async findAll(
    householdId: string,
    filters: {
      accountId?: string;
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      type?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: Prisma.TransactionWhereInput = {
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

  async findOne(householdId: string, id: string) {
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
      throw new NotFoundException('Transaction not found in this household');
    }

    return transaction;
  }

  async remove(householdId: string, id: string) {
    const txData = await this.findOne(householdId, id);

    const amount = Number(txData.amount);
    const exchangeRate = Number(txData.exchangeRate);

    return this.prisma.$transaction(async (tx) => {
      // Reverse balances
      if (txData.type === 'income') {
        await tx.account.update({
          where: { id: txData.accountId },
          data: { currentBalance: { decrement: amount } },
        });
      } else if (txData.type === 'expense') {
        await tx.account.update({
          where: { id: txData.accountId },
          data: { currentBalance: { increment: amount } },
        });
      } else if (txData.type === 'transfer') {
        // Increment source back
        await tx.account.update({
          where: { id: txData.accountId },
          data: { currentBalance: { increment: amount } },
        });
        // Decrement destination back
        const destAmount = amount * exchangeRate;
        if (txData.transferToAccountId) {
          await tx.account.update({
            where: { id: txData.transferToAccountId },
            data: { currentBalance: { decrement: destAmount } },
          });
        }
      }

      // Instead of hard deleting, we can hard delete splits and tags, and hard delete the transaction itself
      // This keeps database sizes small for SQLite MVP, but can be updated to soft-delete if auditing is needed.
      // Since schema.prisma has splits cascading delete: `onDelete: Cascade` and tags cascade: `onDelete: Cascade`
      // We can just delete the transaction!
      return tx.transaction.delete({
        where: { id },
      });
    });
  }

  async update(householdId: string, id: string, dto: UpdateTransactionDto, userId: string) {
    const existing = await this.findOne(householdId, id);

    // Prepare updated values by merging
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
      throw new BadRequestException('Transfer transactions require a destination account (transferToAccountId)');
    }

    if (newType === 'transfer' && newAccountId === newTransferToAccountId) {
      throw new BadRequestException('Source and destination accounts must be different for transfer transactions');
    }

    if (dto.splits) {
      this.validateSplits(newAmount, dto.splits);
    }

    // Verify accounts exist in household
    const acc = await this.prisma.account.findFirst({
      where: { id: newAccountId, householdId },
    });
    if (!acc) {
      throw new NotFoundException(`Source account not found in this household`);
    }

    if (newType === 'transfer') {
      if (!newTransferToAccountId) {
        throw new BadRequestException('Transfer transactions require a destination account');
      }
      const destAcc = await this.prisma.account.findFirst({
        where: { id: newTransferToAccountId, householdId },
      });
      if (!destAcc) {
        throw new NotFoundException(`Destination account not found in this household`);
      }
    }

    // Verify category
    if (newCategoryId) {
      const cat = await this.prisma.category.findFirst({
        where: {
          id: newCategoryId,
          OR: [{ householdId }, { isSystem: true }],
        },
      });
      if (!cat) {
        throw new NotFoundException('Category not found');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. REVERSE old balances
      const oldAmount = Number(existing.amount);
      const oldExchange = Number(existing.exchangeRate);

      if (existing.type === 'income') {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { currentBalance: { decrement: oldAmount } },
        });
      } else if (existing.type === 'expense') {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { currentBalance: { increment: oldAmount } },
        });
      } else if (existing.type === 'transfer') {
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

      // 2. APPLY new balances
      if (newType === 'income') {
        await tx.account.update({
          where: { id: newAccountId },
          data: { currentBalance: { increment: newAmount } },
        });
      } else if (newType === 'expense') {
        await tx.account.update({
          where: { id: newAccountId },
          data: { currentBalance: { decrement: newAmount } },
        });
      } else if (newType === 'transfer') {
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

      // 3. Delete old splits if new splits are provided, or if the amount is updated and we need to verify splits again
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

      // 4. Update tags if provided
      if (dto.tags) {
        await tx.transactionTag.deleteMany({
          where: { transactionId: id },
        });

        for (const tagName of dto.tags) {
          const formattedName = tagName.trim().toLowerCase();
          if (!formattedName) continue;

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

      // 5. Update transaction details
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
}
