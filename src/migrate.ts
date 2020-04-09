import { MikroORM } from 'mikro-orm';
import config from './mikro-orm.config';

(async (): Promise<void> => {
  const orm = await MikroORM.init({
    ...config,
    migrations: {
      path: 'migrations',
      transactional: true,
      allOrNothing: true,
      emit: 'ts',
    },
  });

  const generator = await orm.getSchemaGenerator();
  // await generator.dropSchema();
  await generator.updateSchema();

  await orm.close(true);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
