import { IsString, IsOptional, IsBoolean, IsNumber, ValidateIf } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((object, value) => value !== null)
  parentId?: string | null;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
