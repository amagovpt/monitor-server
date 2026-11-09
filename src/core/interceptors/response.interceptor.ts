import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T | T[];
  timestamp: string;
  pagination?: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result) => {
        const response = context.switchToHttp().getResponse();
        if (result instanceof StreamableFile || response.headersSent) {
          return result;
        }

        if (!result || typeof result !== 'object') {
          return { timestamp: new Date().toISOString(), data: result };
        }

        if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
          return {
            timestamp: new Date().toISOString(),
            data: result.data,
            ...(result.meta && {
              pagination: {
                totalItems: result.meta.totalItems,
                itemCount:
                  result.meta.itemCount ??
                  (Array.isArray(result.data) ? result.data.length : undefined),
                itemsPerPage: result.meta.itemsPerPage,
                totalPages: result.meta.totalPages,
                currentPage: result.meta.currentPage,
              },
            }),
          };
        }
        return { timestamp: new Date().toISOString(), data: result };
      }),
    );
  }
}
