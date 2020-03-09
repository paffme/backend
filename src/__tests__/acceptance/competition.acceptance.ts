import {PaffmeApplication} from '../..';
import {Client, expect} from '@loopback/testlab';
import {givenCompetition, givenEmptyDatabase} from '../helpers/database.helper';
import {setupApplication} from '../helpers/setup.helper';
import {Competition} from '../../models';

describe('Product (acceptance)', function() {
  let app: PaffmeApplication;
  let client: Client;

  before(givenEmptyDatabase);
  before(async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('retrieves competitions', async () => {
    const competition = await givenCompetition();
    const response = await client.get('/competitions').expect(200);
    expect(response.body.map((c: Competition) => c.id)).to.containEql(competition.id);
  });
});
