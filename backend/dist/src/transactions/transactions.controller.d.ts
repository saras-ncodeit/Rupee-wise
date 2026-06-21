import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Request } from 'express';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(householdId: string, dto: CreateTransactionDto, req: Request): Promise<({
        splits: {
            id: string;
            categoryId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        exchangeRate: import("@prisma/client/runtime/library").Decimal;
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
    findAll(householdId: string, accountId?: string, categoryId?: string, startDate?: string, endDate?: string, search?: string, type?: string, limit?: number, offset?: number): Promise<{
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
                amount: import("@prisma/client/runtime/library").Decimal;
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
                openingBalance: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                currentBalance: import("@prisma/client/runtime/library").Decimal;
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
                openingBalance: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                currentBalance: import("@prisma/client/runtime/library").Decimal;
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
            amount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            exchangeRate: import("@prisma/client/runtime/library").Decimal;
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
    findOne(householdId: string, transactionId: string): Promise<{
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
            openingBalance: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            currentBalance: import("@prisma/client/runtime/library").Decimal;
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
            openingBalance: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            currentBalance: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        exchangeRate: import("@prisma/client/runtime/library").Decimal;
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
    update(householdId: string, transactionId: string, dto: UpdateTransactionDto, req: Request): Promise<{
        splits: {
            id: string;
            categoryId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        exchangeRate: import("@prisma/client/runtime/library").Decimal;
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
    remove(householdId: string, transactionId: string): Promise<{
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
        amount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        exchangeRate: import("@prisma/client/runtime/library").Decimal;
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
