"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IdempotencyInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let IdempotencyInterceptor = IdempotencyInterceptor_1 = class IdempotencyInterceptor {
    constructor() {
        this.TTL = 60 * 60 * 1000;
    }
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        if (!['POST', 'PATCH', 'PUT'].includes(request.method)) {
            return next.handle();
        }
        const idempotencyKey = request.headers['idempotency-key'] || request.body?.idempotencyKey;
        if (!idempotencyKey || typeof idempotencyKey !== 'string') {
            return next.handle();
        }
        const key = `${request.user?.id || 'anonymous'}:${idempotencyKey}`;
        const cached = IdempotencyInterceptor_1.cache.get(key);
        if (cached) {
            if (cached.status === 'processing') {
                throw new common_1.ConflictException('A request with this idempotency key is already in progress.');
            }
            response.status(cached.statusCode || 200);
            response.setHeader('x-cache-lookup', 'HIT - Idempotent');
            return (0, rxjs_1.of)(cached.body);
        }
        const timeoutId = setTimeout(() => {
            IdempotencyInterceptor_1.cache.delete(key);
        }, this.TTL);
        IdempotencyInterceptor_1.cache.set(key, {
            status: 'processing',
            timeoutId,
        });
        return next.handle().pipe((0, operators_1.tap)((body) => {
            const entry = IdempotencyInterceptor_1.cache.get(key);
            if (entry) {
                entry.status = 'completed';
                entry.statusCode = response.statusCode;
                entry.body = body;
            }
        }), (0, operators_1.catchError)((err) => {
            const entry = IdempotencyInterceptor_1.cache.get(key);
            if (entry) {
                clearTimeout(entry.timeoutId);
                IdempotencyInterceptor_1.cache.delete(key);
            }
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
};
exports.IdempotencyInterceptor = IdempotencyInterceptor;
IdempotencyInterceptor.cache = new Map();
exports.IdempotencyInterceptor = IdempotencyInterceptor = IdempotencyInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], IdempotencyInterceptor);
//# sourceMappingURL=idempotency.interceptor.js.map