import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../app-logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const { method, user } = request;
    const path = (request.originalUrl || request.url).split('?')[0];
    const started = Date.now();

    const buildLog = (status: number) => ({
      method,
      path,
      status,
      origin: request.ip,
      user: user?.id ?? 'anonymous',
      durationMs: Date.now() - started,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const status = http.getResponse().statusCode;
          this.logger.log(JSON.stringify(buildLog(status)));
        },
        error: (err) => {
          const status = err?.getStatus?.() ?? 500;
          this.logger.error(`Request failed: ${JSON.stringify(buildLog(status))}`, err?.stack);
        },
      }),
    );
  }
}
