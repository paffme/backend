import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(error: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const status = error.getStatus();

    if (
      status === HttpStatus.UNAUTHORIZED &&
      typeof error.response !== 'string'
    ) {
      error.response.message =
        error.response.message ||
        'You do not have permission to access this resource';
    }

    res.status(status).json({
      statusCode: status,
      code: error.response.code || error.code,
      error: error.response.error,
      message: error.response.message || error.message,
      errors: error.errors,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
