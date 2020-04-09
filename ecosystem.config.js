module.exports = {
  apps: [
    {
      name: 'paffme',
      script: 'npm',
      args: 'run start:prod',
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
        JWT_SECRET:
          'vFP8CTP9svUPYHD/rBnzdh2kTDxj3ZllnvsYGTo1oz7QL0e2y3NuEejHFO/Gzp5d+HHgHHXD9twTo0Rj5ssQrwRxVieANBLkIxkAhTFPAHJPGXbtJZvfIS2b64SQFkFY7GIWrIhRvc6XHuFlPi+RtmvNmze/8AwwowL4/q32mrQF/xqOszS82DJL94GjB1HNOvw8W+oPL9XIHBzZB00eBjgKnVN0oYcRXL9JQPThyTTx1ArTCVbpnQHNXcCDjgUyxVO7kfU7sTJIwWFJrLmodpgwLBNaYgkSMSzWN+3HGP9QfielN2VmIrKSWAZGVePtx8DLk39cvaqjOAFbXrdROg==',
      },
    },
  ],
};
