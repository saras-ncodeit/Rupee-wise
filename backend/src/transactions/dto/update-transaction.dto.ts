import { IsString, IsOptional, IsEnum, IsNumber, Min, IsDateString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionSplitDto } from './create-transaction.dto';

export class UpdateTransactionDto {
  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['income', 'expense', 'transfer'])
  type?: 'income' | 'expense' | 'transfer';

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  exchangeRate?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  transferToAccountId?: string;

  @IsBoolean()
  @IsOptional()
  isReimbursable?: boolean;

  @IsString()
  @IsOptional()
  loanId?: string;

  @IsString()
  @IsOptional()
  billId?: string;

  @IsString()
  @IsOptional()
  investmentId?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TransactionSplitDto)
  splits?: TransactionSplitDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
