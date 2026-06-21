import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class SetBudgetDto {
  @IsString()
  @IsNotEmpty()
  // Format: "YYYY-MM" (e.g. "2026-06")
  month: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalIncomeBudget?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
