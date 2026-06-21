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
exports.BudgetsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const household_role_guard_1 = require("../households/guards/household-role.guard");
const require_roles_decorator_1 = require("../households/decorators/require-roles.decorator");
const budgets_service_1 = require("./budgets.service");
const set_budget_dto_1 = require("./dto/set-budget.dto");
const set_budget_lines_dto_1 = require("./dto/set-budget-lines.dto");
const copy_budget_dto_1 = require("./dto/copy-budget.dto");
let BudgetsController = class BudgetsController {
    constructor(budgetsService) {
        this.budgetsService = budgetsService;
    }
    async setBudget(householdId, dto, req) {
        const user = req.user;
        return this.budgetsService.setBudget(householdId, user.id, dto);
    }
    async setBudgetLines(householdId, month, dto, req) {
        const user = req.user;
        return this.budgetsService.setBudgetLines(householdId, month, dto, user.id);
    }
    async getBudgetDetails(householdId, month) {
        return this.budgetsService.getBudgetDetails(householdId, month);
    }
    async copyBudget(householdId, dto, req) {
        const user = req.user;
        return this.budgetsService.copyBudget(householdId, user.id, dto.sourceMonth, dto.targetMonth);
    }
    async getAggregations(householdId, timeframe, yearType, year) {
        const selectedTimeframe = timeframe || 'monthly';
        const selectedYearType = yearType || 'calendar';
        const selectedYear = year ? Number(year) : new Date().getUTCFullYear();
        return this.budgetsService.getAggregations(householdId, selectedTimeframe, selectedYearType, selectedYear);
    }
};
exports.BudgetsController = BudgetsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_roles_decorator_1.RequireRoles)('owner', 'co_owner', 'member'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_budget_dto_1.SetBudgetDto, Object]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "setBudget", null);
__decorate([
    (0, common_1.Post)(':month/lines'),
    (0, require_roles_decorator_1.RequireRoles)('owner', 'co_owner', 'member'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Param)('month')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, set_budget_lines_dto_1.SetBudgetLinesDto, Object]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "setBudgetLines", null);
__decorate([
    (0, common_1.Get)(':month'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "getBudgetDetails", null);
__decorate([
    (0, common_1.Post)('copy'),
    (0, require_roles_decorator_1.RequireRoles)('owner', 'co_owner', 'member'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, copy_budget_dto_1.CopyBudgetDto, Object]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "copyBudget", null);
__decorate([
    (0, common_1.Get)('aggregations/trends'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('yearType')),
    __param(3, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "getAggregations", null);
exports.BudgetsController = BudgetsController = __decorate([
    (0, common_1.Controller)('households/:householdId/budgets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, household_role_guard_1.HouseholdRoleGuard),
    __metadata("design:paramtypes", [budgets_service_1.BudgetsService])
], BudgetsController);
//# sourceMappingURL=budgets.controller.js.map