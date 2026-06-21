import { IsString, IsNotEmpty } from 'class-validator';

export class CopyBudgetDto {
  @IsString()
  @IsNotEmpty()
  // Format: "YYYY-MM"
  sourceMonth: string;

  @IsString()
  @IsNotEmpty()
  // Format: "YYYY-MM"
  targetMonth: string;
}
