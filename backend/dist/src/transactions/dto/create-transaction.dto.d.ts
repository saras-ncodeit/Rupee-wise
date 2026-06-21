export declare class TransactionSplitDto {
    categoryId: string;
    amount: number;
    notes?: string;
}
export declare class CreateTransactionDto {
    accountId: string;
    categoryId?: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency?: string;
    exchangeRate?: number;
    date: string;
    description?: string;
    notes?: string;
    transferToAccountId?: string;
    isReimbursable?: boolean;
    loanId?: string;
    billId?: string;
    investmentId?: string;
    splits?: TransactionSplitDto[];
    tags?: string[];
}
