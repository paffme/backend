import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configure } from './app.configuration';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configure(app);
  await app.listen(AppModule.port);
}

bootstrap();
