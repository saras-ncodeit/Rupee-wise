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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const household_role_guard_1 = require("./guards/household-role.guard");
const require_roles_decorator_1 = require("./decorators/require-roles.decorator");
const households_service_1 = require("./households.service");
const create_household_dto_1 = require("./dto/create-household.dto");
const invite_member_dto_1 = require("./dto/invite-member.dto");
const update_member_role_dto_1 = require("./dto/update-member-role.dto");
let HouseholdsController = class HouseholdsController {
    constructor(householdsService) {
        this.householdsService = householdsService;
    }
    async create(dto, req) {
        const user = req.user;
        return this.householdsService.create(user.id, dto);
    }
    async findAll(req) {
        const user = req.user;
        return this.householdsService.findAllForUser(user.id);
    }
    async findOne(householdId) {
        return this.householdsService.findOne(householdId);
    }
    async invite(householdId, dto, req) {
        const user = req.user;
        return this.householdsService.invite(householdId, dto, user.id);
    }
    async removeMember(householdId, userId, req) {
        const user = req.user;
        return this.householdsService.removeMember(householdId, userId, user.id);
    }
    async updateMemberRole(householdId, userId, dto, req) {
        const user = req.user;
        return this.householdsService.updateMemberRole(householdId, userId, dto, user.id);
    }
};
exports.HouseholdsController = HouseholdsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_household_dto_1.CreateHouseholdDto, Object]),
    __metadata("design:returntype", Promise)
], HouseholdsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HouseholdsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':householdId'),
    (0, common_1.UseGuards)(household_role_guard_1.HouseholdRoleGuard),
    __param(0, (0, common_1.Param)('householdId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseholdsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':householdId/members'),
    (0, common_1.UseGuards)(household_role_guard_1.HouseholdRoleGuard),
    (0, require_roles_decorator_1.RequireRoles)('owner', 'co_owner'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invite_member_dto_1.InviteMemberDto, Object]),
    __metadata("design:returntype", Promise)
], HouseholdsController.prototype, "invite", null);
__decorate([
    (0, common_1.Delete)(':householdId/members/:userId'),
    (0, common_1.UseGuards)(household_role_guard_1.HouseholdRoleGuard),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], HouseholdsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Patch)(':householdId/members/:userId'),
    (0, common_1.UseGuards)(household_role_guard_1.HouseholdRoleGuard),
    (0, require_roles_decorator_1.RequireRoles)('owner', 'co_owner'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_member_role_dto_1.UpdateMemberRoleDto, Object]),
    __metadata("design:returntype", Promise)
], HouseholdsController.prototype, "updateMemberRole", null);
exports.HouseholdsController = HouseholdsController = __decorate([
    (0, common_1.Controller)('households'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [households_service_1.HouseholdsService])
], HouseholdsController);
//# sourceMappingURL=households.controller.js.map