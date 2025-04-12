import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const reqTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const resTime = Date.now();
        const diff = resTime - reqTime;

        if (diff > 1000) {
          console.log(
            `[TIMEOUT] [${req.method} ${req.url}] Response Time: ${diff}ms`,
          );

          throw new InternalServerErrorException('Request Timeout');
        } else {
          console.log(`[${req.method} ${req.url}] Response Time: ${diff}ms`);
        }
      }),
    );
  }
}
