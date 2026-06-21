import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(householdId: string, dto: CreateAccountDto) {
    const openingBalance = dto.openingBalance ?? 0;
    return this.prisma.account.create({
      data: {
        householdId,
        name: dto.name,
        type: dto.type,
        institution: dto.institution,
        accountNumberLast4: dto.accountNumberLast4,
        currency: dto.currency || 'INR',
        openingBalance,
        currentBalance: openingBalance,
        color: dto.color,
      },
    });
  }

  async findAll(householdId: string) {
    return this.prisma.account.findMany({
      where: { householdId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(householdId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, householdId },
    });

    if (!account) {
      throw new NotFoundException('Account not found in this household');
    }

    return account;
  }

  async update(householdId: string, id: string, dto: UpdateAccountDto) {
    const account = await this.findOne(householdId, id);

    // If openingBalance changes, we adjust the currentBalance accordingly
    let balanceAdjustment = 0;
    if (dto.openingBalance !== undefined) {
      const oldOpening = Number(account.openingBalance);
      const newOpening = dto.openingBalance;
      balanceAdjustment = newOpening - oldOpening;
    }

    return this.prisma.account.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        institution: dto.institution,
        accountNumberLast4: dto.accountNumberLast4,
        currency: dto.currency,
        color: dto.color,
        isActive: dto.isActive,
        openingBalance: dto.openingBalance !== undefined ? dto.openingBalance : undefined,
        currentBalance: balanceAdjustment !== 0 ? { increment: balanceAdjustment } : undefined,
      },
    });
  }

  async remove(householdId: string, id: string) {
    const account = await this.findOne(householdId, id);

    // Check if the account has transactions
    const transactionCount = await this.prisma.transaction.count({
      where: {
        OR: [
          { accountId: id },
          { transferToAccountId: id },
        ],
      },
    });

    if (transactionCount > 0) {
      throw new BadRequestException('Cannot delete account because it has transactions. Deactivate the account instead.');
    }

    return this.prisma.account.delete({
      where: { id },
    });
  }
}
