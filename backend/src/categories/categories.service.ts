import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(householdId: string, dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
      if (parent.parentId) {
        throw new BadRequestException('Nesting category limits to 2 levels. Cannot select a subcategory as a parent.');
      }
    }

    return this.prisma.category.create({
      data: {
        householdId,
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId || null,
        icon: dto.icon || 'Category',
        color: dto.color || '#646cff',
        isSystem: false,
      },
    });
  }

  async findAll(householdId: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { householdId },
          { isSystem: true },
        ],
        isArchived: false,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(householdId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        OR: [
          { householdId },
          { isSystem: true },
        ],
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(householdId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(householdId, id);

    if (category.isSystem) {
      throw new ForbiddenException('System categories cannot be updated.');
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent.');
      }
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
      if (parent.parentId) {
        throw new BadRequestException('Nesting category limits to 2 levels. Cannot select a subcategory as a parent.');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        parentId: dto.parentId !== undefined ? dto.parentId : undefined,
        icon: dto.icon,
        color: dto.color,
        sortOrder: dto.sortOrder,
        isArchived: dto.isArchived,
      },
    });
  }

  async remove(householdId: string, id: string) {
    const category = await this.findOne(householdId, id);

    if (category.isSystem) {
      throw new ForbiddenException('System categories cannot be archived.');
    }

    // Check if category has subcategories, if yes archive them too
    const subCategories = await this.prisma.category.findMany({
      where: { parentId: id },
    });

    return this.prisma.$transaction(async (tx) => {
      // Archive subcategories
      if (subCategories.length > 0) {
        await tx.category.updateMany({
          where: { parentId: id },
          data: { isArchived: true },
        });
      }

      // Archive self
      return tx.category.update({
        where: { id },
        data: { isArchived: true },
      });
    });
  }
}
