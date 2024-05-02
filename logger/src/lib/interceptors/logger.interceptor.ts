import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body } = req;
    this.logger.info(`[${method}] ${url} - Payload: ${JSON.stringify(body)}`);
    return next.handle().pipe(
      tap(() => this.logger.info(`[${method}] ${url} - Response sent`)),
      catchError((error) => {
        this.logger.error(`[${method}] ${url} - Error: ${error.message}`);

        return throwError(error);
      })
    );
  }
}
