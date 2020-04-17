export type RepositoryMock = {
  persistAndFlush: jest.Mock;
  [key: string]: jest.Mock;
};

export type ServiceMock = {
  [key: string]: jest.Mock;
};
