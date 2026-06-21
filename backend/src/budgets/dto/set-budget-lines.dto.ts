import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean, IsArray, ValidateNested, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BudgetLineDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @Min(0)
  plannedAmount: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rolloverAmount?: number;

  @IsBoolean()
  @IsOptional()
  isPercentage?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  percentageValue?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  alertAtPct?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weeklyOverride?: number;
}

export class SetBudgetLinesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  lines: BudgetLineDto[];
}
