import {Client, expect} from '@loopback/testlab';
import {PaffmeApplication} from '../..';
import {setupApplication} from '../helpers/setup.helper';

describe('HomePageController', () => {
  let app: PaffmeApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('exposes a default home page', async () => {
    const res = await client
      .get('/')
      .expect(200)
      .expect('Content-Type', /text\/html/);

    expect(res.body).to.match(/paffme/);
  });
});
