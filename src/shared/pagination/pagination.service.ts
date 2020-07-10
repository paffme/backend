import { Injectable } from '@nestjs/common';
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
  PAGE,
  PER_PAGE,
} from './pagination-queries.dto';
import LinkHeader from 'http-link-header';
import { Response } from 'express';
import { ConfigurationService } from '../configuration/configuration.service';
import { isNil } from '../utils/objects.helper';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export interface OffsetLimitRequest {
  offset: number;
  limit: number;
}

export interface OffsetLimitResponse<T> {
  total: number;
  data: T[];
}

class LinkBuilder {
  private readonly link = new LinkHeader();

  constructor(
    private readonly url: URL,
    private readonly currentPage: number,
    private readonly currentPerPage: number,
    private readonly total: number,
  ) {
    this.url.searchParams.set(PAGE, String(this.currentPage));
    this.url.searchParams.set(PER_PAGE, String(this.currentPerPage));
  }

  private get lastPage(): number {
    return Math.ceil(this.total / this.currentPerPage);
  }

  first(): this {
    if (this.total <= DEFAULT_PER_PAGE) {
      return this;
    }

    this.url.searchParams.set(PAGE, String(DEFAULT_PAGE));

    this.link.set({
      rel: 'first',
      uri: this.url.href,
    });

    return this;
  }

  previous(): this {
    if (this.currentPage <= DEFAULT_PAGE) {
      return this;
    }

    this.url.searchParams.set(PAGE, String(this.currentPage - 1));

    this.link.set({
      rel: 'previous',
      uri: this.url.href,
    });

    return this;
  }

  next(): this {
    if (this.currentPage >= this.lastPage) {
      return this;
    }

    this.url.searchParams.set(PAGE, String(this.currentPage + 1));

    this.link.set({
      rel: 'next',
      uri: this.url.href,
    });

    return this;
  }

  last(): this {
    if (this.total <= this.currentPerPage) {
      return this;
    }

    this.url.searchParams.set(PAGE, String(this.lastPage));

    this.link.set({
      rel: 'last',
      uri: this.url.href,
    });

    return this;
  }

  build(): string {
    return this.link.toString();
  }
}

@Injectable()
export class PaginationService {
  private readonly baseUrl: string;

  constructor(configurationService: ConfigurationService) {
    this.baseUrl = configurationService.get('BASE_API_URL');
  }

  private extractUrl(response: Response): URL {
    return new URL(this.baseUrl + response.req!.originalUrl);
  }

  private getCurrentPage(url: URL): number {
    const param = url.searchParams.get(PAGE);

    if (isNil(param)) {
      return DEFAULT_PAGE;
    }

    return Number(param);
  }

  private getCurrentPerPage(url: URL): number {
    const param = url.searchParams.get(PER_PAGE);

    if (isNil(param)) {
      return DEFAULT_PER_PAGE;
    }

    return Number(param);
  }

  addPaginationHeaders<T>(
    offsetLimitResponse: OffsetLimitResponse<T>,
    response: Response,
  ): void {
    const url = this.extractUrl(response);
    const currentPage = this.getCurrentPage(url);
    const currentPerPage = this.getCurrentPerPage(url);

    const link = new LinkBuilder(
      url,
      currentPage,
      currentPerPage,
      offsetLimitResponse.total,
    )
      .first()
      .previous()
      .next()
      .last()
      .build();

    if (link.length > 0) {
      response.setHeader('Link', link);
    }
  }
}
