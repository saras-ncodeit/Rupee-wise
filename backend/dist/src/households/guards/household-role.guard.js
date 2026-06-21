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
exports.HouseholdRoleGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const require_roles_decorator_1 = require("../decorators/require-roles.decorator");
let HouseholdRoleGuard = class HouseholdRoleGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(require_roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('User is not authenticated');
        }
        let householdId = request.params.householdId ||
            request.headers['x-household-id'] ||
            request.body.householdId ||
            request.query.householdId;
        if (Array.isArray(householdId)) {
            householdId = householdId[0];
        }
        if (!householdId) {
            throw new common_1.BadRequestException('Household ID is required for this request');
        }
        const member = await this.prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId: user.id,
                },
            },
        });
        if (!member) {
            throw new common_1.ForbiddenException('You are not a member of this household');
        }
        request.householdMember = member;
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const hasRole = requiredRoles.includes(member.role);
        if (!hasRole) {
            throw new common_1.ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
        }
        return true;
    }
};
exports.HouseholdRoleGuard = HouseholdRoleGuard;
exports.HouseholdRoleGuard = HouseholdRoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], HouseholdRoleGuard);
//# sourceMappingURL=household-role.guard.js.map