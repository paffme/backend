import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import { NestExpressApplication } from '@nestjs/platform-express';
import SwaggerParser from '@apidevtools/swagger-parser';

describe('AppController (e2e)', () => {
  let app: NestExpressApplication;
  let api: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configure(app);
    await app.init();
    api = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    const { body } = await api.get('/').expect(200);
    expect(body).toHaveProperty('startedAt');
    expect(body).toHaveProperty('uptime');
  });

  it('/swagger.json (GET)', async () => {
    const { body } = await api.get('/swagger.json').expect(200);
    expect(body.openapi).toEqual('3.0.0');
    expect(await SwaggerParser.validate(body)).toBeTruthy();
  });
});
