import { TransactionSplitDto } from './create-transaction.dto';
export declare class UpdateTransactionDto {
    accountId?: string;
    categoryId?: string;
    type?: 'income' | 'expense' | 'transfer';
    amount?: number;
    currency?: string;
    exchangeRate?: number;
    date?: string;
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
