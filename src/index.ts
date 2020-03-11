import {PaffmeApplication} from './application';
export {PaffmeApplication};

export async function main() {
  const app = new PaffmeApplication({
    rest: {
      host: process.env.PAFFME_HOST,
      port: process.env.PAFFME_PORT,
    },
  });

  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  return app;
}
