import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(request, response.statusCode, Date.now() - startedAt);
        },
        error: () => {
          this.logRequest(request, response.statusCode, Date.now() - startedAt);
        },
      }),
    );
  }

  private logRequest(
    request: Request,
    statusCode: number,
    durationMs: number,
  ): void {
    const actorId = request.actor?.id ?? 'anonymous';
    const actorRole = request.actor?.role ?? 'anonymous';
    const message = JSON.stringify({
      method: request.method,
      path: request.originalUrl,
      actorId,
      actorRole,
      statusCode,
      durationMs,
    });

    if (statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }
}
