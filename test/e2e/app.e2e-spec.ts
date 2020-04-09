import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import { NestExpressApplication } from '@nestjs/platform-express';
import SwaggerParser from "@apidevtools/swagger-parser";

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

  it('/ (GET)', () =>
    api
      .get('/api')
      .expect(200)
      .then((res) => {
        expect(res.body).toHaveProperty('startedAt');
        expect(res.body).toHaveProperty('uptime');
      }));

  it('/swagger.json (GET)', () =>
    api
      .get('/swagger.json')
      .expect(200)
      .then(async (res) => {
        expect(res.body.openapi).toEqual('3.0.0');
        expect(await SwaggerParser.validate(res.body)).toBeTruthy();
      }));
});
