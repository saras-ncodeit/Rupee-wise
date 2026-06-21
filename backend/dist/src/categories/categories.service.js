"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(householdId, dto) {
        if (dto.parentId) {
            const parent = await this.prisma.category.findUnique({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent category not found');
            }
            if (parent.parentId) {
                throw new common_1.BadRequestException('Nesting category limits to 2 levels. Cannot select a subcategory as a parent.');
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
    async findAll(householdId) {
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
    async findOne(householdId, id) {
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
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async update(householdId, id, dto) {
        const category = await this.findOne(householdId, id);
        if (category.isSystem) {
            throw new common_1.ForbiddenException('System categories cannot be updated.');
        }
        if (dto.parentId) {
            if (dto.parentId === id) {
                throw new common_1.BadRequestException('A category cannot be its own parent.');
            }
            const parent = await this.prisma.category.findUnique({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent category not found');
            }
            if (parent.parentId) {
                throw new common_1.BadRequestException('Nesting category limits to 2 levels. Cannot select a subcategory as a parent.');
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
    async remove(householdId, id) {
        const category = await this.findOne(householdId, id);
        if (category.isSystem) {
            throw new common_1.ForbiddenException('System categories cannot be archived.');
        }
        const subCategories = await this.prisma.category.findMany({
            where: { parentId: id },
        });
        return this.prisma.$transaction(async (tx) => {
            if (subCategories.length > 0) {
                await tx.category.updateMany({
                    where: { parentId: id },
                    data: { isArchived: true },
                });
            }
            return tx.category.update({
                where: { id },
                data: { isArchived: true },
            });
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map