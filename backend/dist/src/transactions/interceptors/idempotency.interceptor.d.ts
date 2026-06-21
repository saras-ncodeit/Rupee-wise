import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class IdempotencyInterceptor implements NestInterceptor {
    private static cache;
    private readonly TTL;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
