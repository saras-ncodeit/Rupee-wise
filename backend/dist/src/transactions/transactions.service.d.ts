import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Prisma } from '@prisma/client';
export declare class TransactionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private validateSplits;
    create(householdId: string, userId: string, dto: CreateTransactionDto): Promise<({
        splits: {
            id: string;
            categoryId: string;
            amount: Prisma.Decimal;
            notes: string | null;
            transactionId: string;
        }[];
        tags: ({
            tag: {
                id: string;
                householdId: string;
                name: string;
                color: string | null;
            };
        } & {
            transactionId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        householdId: string;
        type: string;
        createdAt: Date;
        currency: string;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string;
        transferToAccountId: string | null;
        accountId: string;
        categoryId: string | null;
        amount: Prisma.Decimal;
        notes: string | null;
        exchangeRate: Prisma.Decimal;
        date: Date;
        description: string | null;
        isReimbursable: boolean;
        loanId: string | null;
        billId: string | null;
        investmentId: string | null;
        isRecurring: boolean;
        recurringId: string | null;
        reimbursedAt: Date | null;
        isReviewed: boolean;
    }) | null>;
    findAll(householdId: string, filters: {
        accountId?: string;
        categoryId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        type?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        transactions: ({
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
            } | null;
            splits: ({
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
                amount: Prisma.Decimal;
                notes: string | null;
                transactionId: string;
            })[];
            account: {
                id: string;
                householdId: string;
                name: string;
                type: string;
                color: string | null;
                createdAt: Date;
                currency: string;
                updatedAt: Date;
                institution: string | null;
                accountNumberLast4: string | null;
                openingBalance: Prisma.Decimal;
                isActive: boolean;
                currentBalance: Prisma.Decimal;
            };
            creator: {
                id: string;
                fullName: string;
            };
            tags: ({
                tag: {
                    id: string;
                    householdId: string;
                    name: string;
                    color: string | null;
                };
            } & {
                transactionId: string;
                tagId: string;
            })[];
            transferToAccount: {
                id: string;
                householdId: string;
                name: string;
                type: string;
                color: string | null;
                createdAt: Date;
                currency: string;
                updatedAt: Date;
                institution: string | null;
                accountNumberLast4: string | null;
                openingBalance: Prisma.Decimal;
                isActive: boolean;
                currentBalance: Prisma.Decimal;
            } | null;
        } & {
            id: string;
            householdId: string;
            type: string;
            createdAt: Date;
            currency: string;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string;
            transferToAccountId: string | null;
            accountId: string;
            categoryId: string | null;
            amount: Prisma.Decimal;
            notes: string | null;
            exchangeRate: Prisma.Decimal;
            date: Date;
            description: string | null;
            isReimbursable: boolean;
            loanId: string | null;
            billId: string | null;
            investmentId: string | null;
            isRecurring: boolean;
            recurringId: string | null;
            reimbursedAt: Date | null;
            isReviewed: boolean;
        })[];
        total: number;
        limit: number;
        offset: number;
    }>;
    findOne(householdId: string, id: string): Promise<{
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
        } | null;
        splits: ({
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
            amount: Prisma.Decimal;
            notes: string | null;
            transactionId: string;
        })[];
        account: {
            id: string;
            householdId: string;
            name: string;
            type: string;
            color: string | null;
            createdAt: Date;
            currency: string;
            updatedAt: Date;
            institution: string | null;
            accountNumberLast4: string | null;
            openingBalance: Prisma.Decimal;
            isActive: boolean;
            currentBalance: Prisma.Decimal;
        };
        tags: ({
            tag: {
                id: string;
                householdId: string;
                name: string;
                color: string | null;
            };
        } & {
            transactionId: string;
            tagId: string;
        })[];
        transferToAccount: {
            id: string;
            householdId: string;
            name: string;
            type: string;
            color: string | null;
            createdAt: Date;
            currency: string;
            updatedAt: Date;
            institution: string | null;
            accountNumberLast4: string | null;
            openingBalance: Prisma.Decimal;
            isActive: boolean;
            currentBalance: Prisma.Decimal;
        } | null;
    } & {
        id: string;
        householdId: string;
        type: string;
        createdAt: Date;
        currency: string;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string;
        transferToAccountId: string | null;
        accountId: string;
        categoryId: string | null;
        amount: Prisma.Decimal;
        notes: string | null;
        exchangeRate: Prisma.Decimal;
        date: Date;
        description: string | null;
        isReimbursable: boolean;
        loanId: string | null;
        billId: string | null;
        investmentId: string | null;
        isRecurring: boolean;
        recurringId: string | null;
        reimbursedAt: Date | null;
        isReviewed: boolean;
    }>;
    remove(householdId: string, id: string): Promise<{
        id: string;
        householdId: string;
        type: string;
        createdAt: Date;
        currency: string;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string;
        transferToAccountId: string | null;
        accountId: string;
        categoryId: string | null;
        amount: Prisma.Decimal;
        notes: string | null;
        exchangeRate: Prisma.Decimal;
        date: Date;
        description: string | null;
        isReimbursable: boolean;
        loanId: string | null;
        billId: string | null;
        investmentId: string | null;
        isRecurring: boolean;
        recurringId: string | null;
        reimbursedAt: Date | null;
        isReviewed: boolean;
    }>;
    update(householdId: string, id: string, dto: UpdateTransactionDto, userId: string): Promise<{
        splits: {
            id: string;
            categoryId: string;
            amount: Prisma.Decimal;
            notes: string | null;
            transactionId: string;
        }[];
        tags: ({
            tag: {
                id: string;
                householdId: string;
                name: string;
                color: string | null;
            };
        } & {
            transactionId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        householdId: string;
        type: string;
        createdAt: Date;
        currency: string;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string;
        transferToAccountId: string | null;
        accountId: string;
        categoryId: string | null;
        amount: Prisma.Decimal;
        notes: string | null;
        exchangeRate: Prisma.Decimal;
        date: Date;
        description: string | null;
        isReimbursable: boolean;
        loanId: string | null;
        billId: string | null;
        investmentId: string | null;
        isRecurring: boolean;
        recurringId: string | null;
        reimbursedAt: Date | null;
        isReviewed: boolean;
    }>;
}
