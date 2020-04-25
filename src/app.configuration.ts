import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { CustomValidationError } from './shared/errors/custom-validation.error';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import * as packageJson from '../package.json';
import { NestExpressApplication } from '@nestjs/platform-express';

export function configure(app: NestExpressApplication): void {
  const hostDomain = AppModule.isDev
    ? `https://${AppModule.host}:${AppModule.port}`
    : AppModule.host;

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
      exceptionFactory: (errors): CustomValidationError =>
        new CustomValidationError(errors),
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    credentials: true,
    origin(requestOrigin: string, cb: (arg1: null, arg2: boolean) => void) {
      cb(null, true);
    },
  });
}
