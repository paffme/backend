import {PaffmeApplication} from '../..';
import {RestServer} from '@loopback/rest';
import {validateApiSpec} from '@loopback/testlab';

describe('API specification', () => {
  it('api spec is valid', async () => {
    const app = new PaffmeApplication();
    const server = await app.getServer(RestServer);
    await validateApiSpec(await server.getApiSpec());
  });
});
