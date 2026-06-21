import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
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
    update(householdId: string, categoryId: string, dto: UpdateCategoryDto): Promise<{
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
    remove(householdId: string, categoryId: string): Promise<{
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
