import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import TestUtils from '../utils';
import { UserService } from '../../src/user/user.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CompetitionService } from '../../src/competition/competition.service';
import * as socketIOClient from 'socket.io-client';
import { BoulderingRoundRankingType } from '../../src/bouldering/round/bouldering-round.entity';
import pEvent from 'p-event';
import Socket = SocketIOClient.Socket;
import { JoinRoomDto } from '../../src/websocket/dto/in/join-room.dto';
import * as path from 'path';
import { promises as fs } from 'fs';

import {
  BoulderService,
  HoldsRecognitionDoneEventPayload,
} from '../../src/bouldering/boulder/boulder.service';

const boulderPhoto = path.resolve(__dirname, '../assets/boulder_photo.jpg');

describe('Boulder websocket (e2e)', () => {
  let app: NestExpressApplication;
  let utils: TestUtils;
  let api: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    configure(app);
    await app.init();
    api = supertest(app.getHttpServer());

    utils = new TestUtils(
      moduleFixture.get(UserService),
      moduleFixture.get(CompetitionService),
      moduleFixture.get(BoulderService),
      moduleFixture.get('MikroORM'),
    );
  });

  let client: Socket;

  beforeEach(async () => {
    utils.clearORM();

    await app.listen(0);
    const port = app.getHttpServer().address().port;
    client = socketIOClient.connect(`ws://localhost:${port}/boulders`);
  });

  afterEach(async () => {
    client.close();
    await app.close();
  });

  it('should connect', async () => {
    return new Promise((resolve, reject) => {
      client.once('connect', resolve);
      client.once('error', reject);
    });
  });

  it('emits holdsRecognitionDone', async () => {
    const { boulder } = await utils.givenReadyCompetition(
      BoulderingRoundRankingType.CIRCUIT,
    );

    const joinGroupRoomDto: JoinRoomDto = {
      roomId: boulder.id,
    };

    client.emit('join', joinGroupRoomDto);

    const [data] = (await Promise.all([
      pEvent(client, 'holdsRecognitionDone'),
      utils.addBoulderPhoto(boulder, await fs.readFile(boulderPhoto), 'jpg'),
    ])) as [HoldsRecognitionDoneEventPayload, unknown];

    expect(data.boulderId).toEqual(boulder.id);
    expect(data.boundingBoxes).toEqual([[1, 2, 3, 4]]);
  });
});
