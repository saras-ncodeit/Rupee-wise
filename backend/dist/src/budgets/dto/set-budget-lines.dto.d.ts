export declare class BudgetLineDto {
    categoryId: string;
    plannedAmount: number;
    rolloverAmount?: number;
    isPercentage?: boolean;
    percentageValue?: number;
    alertAtPct?: number;
    weeklyOverride?: number;
}
export declare class SetBudgetLinesDto {
    lines: BudgetLineDto[];
}
