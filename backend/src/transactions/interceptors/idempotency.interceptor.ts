import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ConflictException, BadRequestException } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Response } from 'express';

interface CacheEntry {
  status: 'processing' | 'completed';
  statusCode?: number;
  body?: any;
  timeoutId: NodeJS.Timeout;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  // Static in-memory cache map for local-fallback
  private static cache = new Map<string, CacheEntry>();
  // 1 hour time-to-live for idempotency keys
  private readonly TTL = 60 * 60 * 1000; 

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();

    // Apply idempotency check only for mutating methods
    if (!['POST', 'PATCH', 'PUT'].includes(request.method)) {
      return next.handle();
    }

    const idempotencyKey = request.headers['idempotency-key'] || request.body?.idempotencyKey;
    
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return next.handle();
    }

    const key = `${request.user?.id || 'anonymous'}:${idempotencyKey}`;
    const cached = IdempotencyInterceptor.cache.get(key);

    if (cached) {
      if (cached.status === 'processing') {
        throw new ConflictException('A request with this idempotency key is already in progress.');
      }
      
      // If completed, return cached response directly bypassing controller
      response.status(cached.statusCode || 200);
      response.setHeader('x-cache-lookup', 'HIT - Idempotent');
      return of(cached.body);
    }

    // Set status to processing
    const timeoutId = setTimeout(() => {
      IdempotencyInterceptor.cache.delete(key);
    }, this.TTL);

    IdempotencyInterceptor.cache.set(key, {
      status: 'processing',
      timeoutId,
    });

    return next.handle().pipe(
      tap((body) => {
        // Cache success responses
        const entry = IdempotencyInterceptor.cache.get(key);
        if (entry) {
          entry.status = 'completed';
          entry.statusCode = response.statusCode;
          entry.body = body;
        }
      }),
      catchError((err) => {
        // Evict key on failure so client can retry
        const entry = IdempotencyInterceptor.cache.get(key);
        if (entry) {
          clearTimeout(entry.timeoutId);
          IdempotencyInterceptor.cache.delete(key);
        }
        return throwError(() => err);
      }),
    );
  }
}
