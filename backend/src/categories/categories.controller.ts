import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HouseholdRoleGuard } from '../households/guards/household-role.guard';
import { RequireRoles } from '../households/decorators/require-roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('households/:householdId/categories')
@UseGuards(JwtAuthGuard, HouseholdRoleGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @RequireRoles('owner', 'co_owner', 'member')
  async create(
    @Param('householdId') householdId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(householdId, dto);
  }

  @Get()
  async findAll(@Param('householdId') householdId: string) {
    return this.categoriesService.findAll(householdId);
  }

  @Patch(':categoryId')
  @RequireRoles('owner', 'co_owner', 'member')
  async update(
    @Param('householdId') householdId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(householdId, categoryId, dto);
  }

  @Delete(':categoryId')
  @RequireRoles('owner', 'co_owner', 'member')
  async remove(
    @Param('householdId') householdId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.categoriesService.remove(householdId, categoryId);
  }
}
