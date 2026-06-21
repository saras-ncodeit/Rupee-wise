import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(householdId: string, dto: CreateCategoryDto): Promise<{
        id: string;
        householdId: string | null;
        parentId: string | null;
        name: string;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        isArchived: boolean;
        sortOrder: number;
        createdAt: Date;
    }>;
    findAll(householdId: string): Promise<{
        id: string;
        householdId: string | null;
        parentId: string | null;
        name: string;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        isArchived: boolean;
        sortOrder: number;
        createdAt: Date;
    }[]>;
    findOne(householdId: string, id: string): Promise<{
        id: string;
        householdId: string | null;
        parentId: string | null;
        name: string;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        isArchived: boolean;
        sortOrder: number;
        createdAt: Date;
    }>;
    update(householdId: string, id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        householdId: string | null;
        parentId: string | null;
        name: string;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        isArchived: boolean;
        sortOrder: number;
        createdAt: Date;
    }>;
    remove(householdId: string, id: string): Promise<{
        id: string;
        householdId: string | null;
        parentId: string | null;
        name: string;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        isArchived: boolean;
        sortOrder: number;
        createdAt: Date;
    }>;
}
