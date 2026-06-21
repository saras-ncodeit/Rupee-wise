export declare class CreateCategoryDto {
    name: string;
    type: 'income' | 'expense' | 'transfer';
    parentId?: string;
    icon?: string;
    color?: string;
}
