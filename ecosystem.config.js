module.exports = {
  apps: [
    {
      name: 'paffme',
      script: 'npm',
      args: 'start:prod',
      env: {
        NODE_ENV: 'development',
      },
      // eslint-disable-next-line @typescript-eslint/camelcase
      env_production: {
        PAFFME_HOST: '0.0.0.0',
        PAFFME_PORT: '4000',
        NODE_ENV: 'production',
        POSTGRESQL_USER: 'paffme',
        POSTGRESQL_PASSWORD: 'paffme',
        POSTGRESQL_DATABASE: 'paffme',
      },
    },
  ],
};
