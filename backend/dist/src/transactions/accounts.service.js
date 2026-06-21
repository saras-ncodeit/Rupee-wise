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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AccountsService = class AccountsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(householdId, dto) {
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
    async findAll(householdId) {
        return this.prisma.account.findMany({
            where: { householdId },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(householdId, id) {
        const account = await this.prisma.account.findFirst({
            where: { id, householdId },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found in this household');
        }
        return account;
    }
    async update(householdId, id, dto) {
        const account = await this.findOne(householdId, id);
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
    async remove(householdId, id) {
        const account = await this.findOne(householdId, id);
        const transactionCount = await this.prisma.transaction.count({
            where: {
                OR: [
                    { accountId: id },
                    { transferToAccountId: id },
                ],
            },
        });
        if (transactionCount > 0) {
            throw new common_1.BadRequestException('Cannot delete account because it has transactions. Deactivate the account instead.');
        }
        return this.prisma.account.delete({
            where: { id },
        });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map