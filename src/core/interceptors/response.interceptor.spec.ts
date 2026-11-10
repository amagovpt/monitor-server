import { CallHandler, ExecutionContext, StreamableFile } from '@nestjs/common';
import {
  Observable,
  Subject,
  EMPTY,
  firstValueFrom,
  lastValueFrom,
  of,
  throwError,
  toArray,
} from 'rxjs';

import { ResponseTransformInterceptor } from './response.interceptor';

describe('ResponseTransformInterceptor (unit)', () => {
  const NOW = new Date('2026-03-10T09:30:15.123Z');
  let interceptor: ResponseTransformInterceptor<any>;

  const ctx = (response: any) =>
    ({ switchToHttp: () => ({ getResponse: () => response }) }) as unknown as ExecutionContext;
  const handler = (obs: Observable<any>): CallHandler => ({ handle: () => obs });
  const run = (value: unknown, response: any = { headersSent: false }) =>
    firstValueFrom(interceptor.intercept(ctx(response), handler(of(value))));

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    interceptor = new ResponseTransformInterceptor();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  describe('plain payloads are wrapped as { timestamp, data }', () => {
    it.each([
      ['a string', 'hello'],
      ['an empty string', ''],
      ['a number', 42],
      ['zero', 0],
      ['true', true],
      ['false', false],
      ['null', null],
      ['undefined', undefined],
    ])('wraps %s', async (_label, value) => {
      const res = await run(value);

      expect(res).toEqual({ timestamp: NOW.toISOString(), data: value });
      expect(Object.keys(res).sort()).toEqual(['data', 'timestamp']);
    });

    it('wraps a plain object', async () => {
      const payload = { id: 1, name: 'alpha' };

      expect(await run(payload)).toEqual({ timestamp: NOW.toISOString(), data: payload });
    });

    it('wraps an array as data (without pagination)', async () => {
      const payload = [{ id: 1 }, { id: 2 }];

      const res = await run(payload);

      expect(res).toEqual({ timestamp: NOW.toISOString(), data: payload });
      expect(res).not.toHaveProperty('pagination');
    });

    it('wraps an empty array', async () => {
      expect(await run([])).toEqual({ timestamp: NOW.toISOString(), data: [] });
    });

    it('wraps a Date as data', async () => {
      const d = new Date('2020-01-01T00:00:00Z');

      expect(await run(d)).toEqual({ timestamp: NOW.toISOString(), data: d });
    });

    it('returns the very same object it was given as data (no copy, no mutation)', async () => {
      const payload = { id: 1, nested: { a: [1, 2] } };
      const snapshot = JSON.parse(JSON.stringify(payload));

      const res = await run(payload);

      expect(res.data).toBe(payload);
      expect(payload).toEqual(snapshot);
    });

    it('does not unwrap an object that only has a "data" key (it is a normal payload)', async () => {
      const payload = { data: [1, 2, 3] };

      const res = await run(payload);

      expect(res).toEqual({ timestamp: NOW.toISOString(), data: payload });
      expect(res).not.toHaveProperty('pagination');
    });

    it('does not treat an object that only has a "meta" key as paginated', async () => {
      const payload = { meta: { totalItems: 3 } };

      const res = await run(payload);

      expect(res).toEqual({ timestamp: NOW.toISOString(), data: payload });
    });

    it('treats an object with a nested "data" array of items that have a "data" field as a normal array', async () => {
      const payload = [{ data: 1, meta: 2 }];

      expect(await run(payload)).toEqual({ timestamp: NOW.toISOString(), data: payload });
    });
  });

  // -------------------------------------------------------------------------
  describe('timestamp', () => {
    it('is an ISO-8601 UTC string with the time of the response', async () => {
      const res = await run({ a: 1 });

      expect(res.timestamp).toBe('2026-03-10T09:30:15.123Z');
      expect(res.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('is taken when the value is emitted, not when intercept() is called', async () => {
      const subject = new Subject<any>();
      const p = firstValueFrom(
        interceptor.intercept(ctx({ headersSent: false }), handler(subject)),
      );

      jest.setSystemTime(new Date('2026-03-10T09:30:20.000Z'));
      subject.next({ a: 1 });

      expect((await p).timestamp).toBe('2026-03-10T09:30:20.000Z');
    });
  });

  // -------------------------------------------------------------------------
  describe('paginated results ({ data, meta })', () => {
    const meta = { totalItems: 25, itemCount: 2, itemsPerPage: 2, totalPages: 13, currentPage: 3 };

    it('unwraps data and exposes the metadata as pagination', async () => {
      const items = [{ id: 5 }, { id: 6 }];

      const res = await run({ data: items, meta });

      expect(res).toEqual({
        timestamp: NOW.toISOString(),
        data: items,
        pagination: {
          totalItems: 25,
          itemCount: 2,
          itemsPerPage: 2,
          totalPages: 13,
          currentPage: 3,
        },
      });
    });

    it('does not leak the original "meta" key', async () => {
      const res = await run({ data: [], meta });

      expect(res).not.toHaveProperty('meta');
    });

    it('only exposes the five documented pagination fields', async () => {
      const res = await run({ data: [], meta: { ...meta, internalCursor: 'secret', foo: 1 } });

      expect(Object.keys(res.pagination).sort()).toEqual([
        'currentPage',
        'itemCount',
        'itemsPerPage',
        'totalItems',
        'totalPages',
      ]);
    });

    it('still returns pagination (with zeros) for an empty page', async () => {
      const res = await run({
        data: [],
        meta: { totalItems: 0, itemCount: 0, itemsPerPage: 10, totalPages: 0, currentPage: 1 },
      });

      expect(res.data).toEqual([]);
      expect(res.pagination).toEqual({
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 0,
        currentPage: 1,
      });
    });

    it('returns the data without pagination when meta is null or undefined', async () => {
      expect(await run({ data: [1], meta: null })).toEqual({
        timestamp: NOW.toISOString(),
        data: [1],
      });
      expect(await run({ data: [1], meta: undefined })).toEqual({
        timestamp: NOW.toISOString(),
        data: [1],
      });
    });

    it('supports a paginated envelope whose data is not an array', async () => {
      const res = await run({ data: { id: 1 }, meta });

      expect(res.data).toEqual({ id: 1 });
      expect(res.pagination.currentPage).toBe(3);
    });

    // The Response contract promises pagination.itemCount. The repositories' own metadata
    // ({ currentPage, itemsPerPage, totalItems, totalPages }) has no itemCount, so the
    // interceptor has to supply it: it is the number of items in this page.
    it('fills itemCount with the number of items in the page when meta does not carry it', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const repositoryMeta = { currentPage: 1, itemsPerPage: 10, totalItems: 3, totalPages: 1 };

      const res = await run({ data: items, meta: repositoryMeta });

      expect(res.pagination.itemCount).toBe(3);
      expect(res.pagination).toEqual({ ...repositoryMeta, itemCount: 3 });
    });
  });

  // -------------------------------------------------------------------------
  describe('responses that must not be touched', () => {
    it('returns a StreamableFile untouched (same instance)', async () => {
      const file = new StreamableFile(Buffer.from('file-content'));

      const res = await run(file);

      expect(res).toBe(file);
    });

    it('returns anything untouched once the headers have already been sent', async () => {
      const payload = { raw: true };

      expect(await run(payload, { headersSent: true })).toBe(payload);
      expect(await run('text', { headersSent: true })).toBe('text');
      expect(await run(undefined, { headersSent: true })).toBeUndefined();
      expect(await run({ data: [1], meta: {} }, { headersSent: true })).toEqual({
        data: [1],
        meta: {},
      });
    });

    it('checks headersSent when the value is emitted (the handler may write the response itself)', async () => {
      const response = { headersSent: false };
      const subject = new Subject<any>();
      const p = firstValueFrom(interceptor.intercept(ctx(response), handler(subject)));

      response.headersSent = true; // handler used @Res() and replied before the stream emits
      subject.next({ a: 1 });

      expect(await p).toEqual({ a: 1 });
    });

    it('reads the response from the HTTP context', async () => {
      const getResponse = jest.fn().mockReturnValue({ headersSent: false });
      const context = { switchToHttp: () => ({ getResponse }) } as unknown as ExecutionContext;

      await firstValueFrom(interceptor.intercept(context, handler(of({ a: 1 }))));

      expect(getResponse).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('stream behaviour', () => {
    it('does not call the route handler more than once', async () => {
      const handle = jest.fn().mockReturnValue(of({ a: 1 }));

      await firstValueFrom(interceptor.intercept(ctx({ headersSent: false }), { handle }));

      expect(handle).toHaveBeenCalledTimes(1);
    });

    it('transforms every emitted value', async () => {
      const out = await lastValueFrom(
        interceptor.intercept(ctx({ headersSent: false }), handler(of('a', 'b'))).pipe(toArray()),
      );

      expect(out).toEqual([
        { timestamp: NOW.toISOString(), data: 'a' },
        { timestamp: NOW.toISOString(), data: 'b' },
      ]);
    });

    it('completes without emitting when the handler emits nothing', async () => {
      const out = await lastValueFrom(
        interceptor.intercept(ctx({ headersSent: false }), handler(EMPTY)).pipe(toArray()),
      );

      expect(out).toEqual([]);
    });

    it('lets errors from the handler through untouched (exception filters deal with them)', async () => {
      const err = new Error('boom');

      await expect(
        firstValueFrom(
          interceptor.intercept(ctx({ headersSent: false }), handler(throwError(() => err))),
        ),
      ).rejects.toBe(err);
    });
  });

  // -------------------------------------------------------------------------
  describe('non-HTTP contexts', () => {
    // A global interceptor also runs for gateways / RPC handlers, where there is no HTTP response
    // object. It must still wrap the value instead of crashing on `response.headersSent`.
    it('does not crash when the context has no HTTP response', async () => {
      const res = await run({ a: 1 }, undefined);

      expect(res).toEqual({ timestamp: NOW.toISOString(), data: { a: 1 } });
    });
  });
});
