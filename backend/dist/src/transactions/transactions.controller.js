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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const household_role_guard_1 = require("../households/guards/household-role.guard");
const require_roles_decorator_1 = require("../households/decorators/require-roles.decorator");
const transactions_service_1 = require("./transactions.service");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const update_transaction_dto_1 = require("./dto/update-transaction.dto");
const idempotency_interceptor_1 = require("./interceptors/idempotency.interceptor");
let TransactionsController = class TransactionsController {
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    async create(householdId, dto, req) {
        const user = req.user;
        return this.transactionsService.create(householdId, user.id, dto);
    }
    async findAll(householdId, accountId, categoryId, startDate, endDate, search, type, limit, offset) {
        return this.transactionsService.findAll(householdId, {
            accountId,
            categoryId,
            startDate,
            endDate,
            search,
            type,
            limit,
            offset,
        });
    }
    async findOne(householdId, transactionId) {
        return this.transactionsService.findOne(householdId, transactionId);
    }
    async update(householdId, transactionId, dto, req) {
        const user = req.user;
        return this.transactionsService.update(householdId, transactionId, dto, user.id);
    }
    async remove(householdId, transactionId) {
        return this.transactionsService.remove(householdId, transactionId);
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)(idempotency_interceptor_1.IdempotencyInterceptor),
    (0, require_roles_decorator_1.RequireRoles)('owner', 'co_owner', 'member'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_transaction_dto_1.CreateTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('categoryId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('search')),
    __param(6, (0, common_1.Query)('type')),
    __param(7, (0, common_1.Query)('limit')),
    __param(8, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':transactionId'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':transactionId'),
    (0, common_1.UseInterceptors)(idempotency_interceptor_1.IdempotencyInterceptor),
    (0, require_roles_decorator_1.RequireRoles)('owner', 'co_owner', 'member'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Param)('transactionId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_transaction_dto_1.UpdateTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':transactionId'),
    (0, require_roles_decorator_1.RequireRoles)('owner', 'co_owner', 'member'),
    __param(0, (0, common_1.Param)('householdId')),
    __param(1, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "remove", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)('households/:householdId/transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, household_role_guard_1.HouseholdRoleGuard),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map