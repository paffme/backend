import { Test } from '@nestjs/testing';
import { PaginationService } from '../../../src/shared/pagination/pagination.service';
import { ConfigurationService } from '../../../src/shared/configuration/configuration.service';
import { Response } from 'express';
import LinkHeader from 'http-link-header';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Pagination service (unit)', () => {
  const BASE_API_URL = new ConfigurationService().get('BASE_API_URL');
  let paginationService: PaginationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConfigurationService, PaginationService],
    }).compile();

    paginationService = module.get(PaginationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not add the header if they are no rels', () => {
    const response = {
      req: {
        originalUrl: '/super/url?query=abc',
      },
      setHeader: jest.fn(),
    };

    paginationService.addPaginationHeaders(
      {
        data: [],
        total: 1,
      },
      (response as unknown) as Response,
    );

    expect(response.setHeader).toHaveBeenCalledTimes(0);
  });

  describe('First link pagination header', () => {
    it('adds first pagination headers', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 500,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(1);
      const { refs } = LinkHeader.parse(response.setHeader.mock.calls[0][1]);

      const first = refs.find((r) => r.rel === 'first');
      expect(first!.uri).toEqual(
        `${BASE_API_URL}/super/url?query=abc&page=1&perPage=30`,
      );
    });

    it('adds first pagination headers by reusing the perPage', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&perPage=11',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 500,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(1);
      const { refs } = LinkHeader.parse(response.setHeader.mock.calls[0][1]);

      const first = refs.find((r) => r.rel === 'first');
      expect(first!.uri).toEqual(
        `${BASE_API_URL}/super/url?query=abc&perPage=11&page=1`,
      );
    });

    it('does not add first pagination header if already at the first page', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&perPage=10',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 5,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(0);
    });
  });

  describe('Previous link pagination header', () => {
    it('adds previous pagination headers', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&page=11',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 1000,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(1);
      const { refs } = LinkHeader.parse(response.setHeader.mock.calls[0][1]);

      const previous = refs.find((r) => r.rel === 'previous');
      expect(previous!.uri).toEqual(
        `${BASE_API_URL}/super/url?query=abc&page=10&perPage=30`,
      );
    });

    it('do not add previous pagination headers if already at the first page', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&page=1',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 10,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(0);
    });

    it('adds previous pagination headers by reusing the perPage', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&page=5&perPage=10',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 2000,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(1);
      const { refs } = LinkHeader.parse(response.setHeader.mock.calls[0][1]);

      const previous = refs.find((r) => r.rel === 'previous');
      expect(previous!.uri).toEqual(
        `${BASE_API_URL}/super/url?query=abc&page=4&perPage=10`,
      );
    });
  });

  describe('Next link pagination header', () => {
    it('adds next pagination headers', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&page=10',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 500,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(1);
      const { refs } = LinkHeader.parse(response.setHeader.mock.calls[0][1]);

      const next = refs.find((r) => r.rel === 'next');
      expect(next!.uri).toEqual(
        `${BASE_API_URL}/super/url?query=abc&page=11&perPage=30`,
      );
    });

    it('do not adds next pagination headers when at the last possible page', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&page=10',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 10,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(1);
      const { refs } = LinkHeader.parse(response.setHeader.mock.calls[0][1]);

      const next = refs.find((r) => r.rel === 'next');
      expect(next).toBeUndefined();
    });

    it('adds next pagination headers by reusing the perPage', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&perPage=2',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 500,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(1);
      const { refs } = LinkHeader.parse(response.setHeader.mock.calls[0][1]);

      const next = refs.find((r) => r.rel === 'next');
      expect(next!.uri).toEqual(
        `${BASE_API_URL}/super/url?query=abc&perPage=2&page=2`,
      );
    });
  });

  describe('Last link pagination header', () => {
    it('adds last pagination headers', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&page=1',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 300,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(1);
      const { refs } = LinkHeader.parse(response.setHeader.mock.calls[0][1]);

      const last = refs.find((r) => r.rel === 'last');
      expect(last!.uri).toEqual(
        `${BASE_API_URL}/super/url?query=abc&page=10&perPage=30`,
      );
    });

    it('adds last pagination headers by reusing perPage', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&page=1&perPage=10',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 100,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(1);
      const { refs } = LinkHeader.parse(response.setHeader.mock.calls[0][1]);

      const last = refs.find((r) => r.rel === 'last');
      expect(last!.uri).toEqual(
        `${BASE_API_URL}/super/url?query=abc&page=10&perPage=10`,
      );
    });

    it('does not add last pagination header if already at the last page', () => {
      const response = {
        req: {
          originalUrl: '/super/url?query=abc&perPage=10',
        },
        setHeader: jest.fn(),
      };

      paginationService.addPaginationHeaders(
        {
          data: [],
          total: 1,
        },
        (response as unknown) as Response,
      );

      expect(response.setHeader).toHaveBeenCalledTimes(0);
    });
  });
});
