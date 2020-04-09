import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { CustomValidationError } from './shared/errors/custom-validation.error';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { Observable } from 'rxjs';
import { join } from 'path';
import * as packageJson from '../package.json';
import { NestExpressApplication } from '@nestjs/platform-express';

class ExposeHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();
    response.set('Access-Control-Expose-Headers', 'Content-Range,Accept-Range');
    return next.handle();
  }
}

export function configure(app: NestExpressApplication): void {
  const hostDomain = AppModule.isDev
    ? `https://${AppModule.host}:${AppModule.port}`
    : AppModule.host;

  app.useStaticAssets(join(__dirname, '../static'));

  const swaggerOptions = new DocumentBuilder()
    .setTitle(packageJson.name)
    .setDescription(packageJson.description)
    .setVersion(packageJson.version)
    .addBearerAuth()
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerOptions);

  SwaggerModule.setup('/explorer', app, swaggerDoc, {
    swaggerUrl: `${hostDomain}/explorer`,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  app.getHttpAdapter().get('/swagger.json', (req, res) => {
    res.json(swaggerDoc);
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => new CustomValidationError(errors),
    }),
  );

  app.useGlobalInterceptors(new ExposeHeadersInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    credentials: true,
    origin(requestOrigin: string, cb: (arg1: null, arg2: boolean) => void) {
      cb(null, true);
    },
  });
}
