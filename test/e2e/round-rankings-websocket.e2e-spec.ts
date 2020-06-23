import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import TestUtils from '../utils';
import { UserService } from '../../src/user/user.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CompetitionService } from '../../src/competition/competition.service';
import { BoulderService } from '../../src/bouldering/boulder/boulder.service';
import * as socketIOClient from 'socket.io-client';
import { BoulderingRoundRankingType } from '../../src/bouldering/round/bouldering-round.entity';
import pEvent from 'p-event';
import Socket = SocketIOClient.Socket;
import { JoinRoomDto } from '../../src/websocket/dto/in/join-room.dto';
import { BoulderingRoundRankingsUpdateEventPayload } from '../../src/bouldering/round/bouldering-round.service';

describe('Round rankings websocket (e2e)', () => {
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
    client = socketIOClient.connect(`ws://localhost:${port}/round-rankings`);
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

  it('emits newRankings', async () => {
    const {
      competition,
      round,
      boulder,
      climber,
    } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

    const joinGroupRoomDto: JoinRoomDto = {
      roomId: round.id,
    };

    client.emit('join', joinGroupRoomDto);

    const [data] = (await Promise.all([
      pEvent(client, 'rankingsUpdate'),
      utils.addBoulderingResult(
        competition,
        round,
        round.groups[0],
        boulder,
        climber,
        {
          top: true,
          zone: true,
          try: 5,
        },
      ),
    ])) as [BoulderingRoundRankingsUpdateEventPayload, unknown];

    expect(data.roundId).toEqual(round.id);
    expect(data.rankings.type).toEqual(BoulderingRoundRankingType.CIRCUIT);

    expect(data.rankings.rankings).toEqual([
      {
        climber: {
          club: climber.club,
          firstName: climber.firstName,
          id: climber.id,
          lastName: climber.lastName,
        },
        ranking: 1,
        tops: [true],
        topsInTries: [5],
        zones: [true],
        zonesInTries: [5],
      },
    ]);

    expect(data.diff).toEqual([
      {
        added: true,
        climberId: climber.id,
      },
    ]);
  });
});
