import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Inject,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) { }
    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        let user = request.user;

        const date = new Date();
        return next.handle().pipe(
            tap((data) => {
                const logData = {
                    path: request.route.path,
                    origin: request.headers.origin,
                    body: JSON.stringify(request.body),
                    date: date.toISOString(),
                    user,
                    response: JSON.stringify(data),
                };
                const dateString = date.toISOString();
                console.log(logData);
                this.logger.log({
                    level: 'http',
                    message: '"' + dateString + '"' + ':' + JSON.stringify(logData)
                });
            }),
        );
    }
}
