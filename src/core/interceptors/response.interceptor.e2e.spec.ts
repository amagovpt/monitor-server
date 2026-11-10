import {
  Controller,
  Delete,
  Get,
  HttpCode,
  INestApplication,
  NotFoundException,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { ResponseTransformInterceptor } from './response.interceptor';

// ---------------------------------------------------------------------------
// A small controller exercising every kind of handler result
// ---------------------------------------------------------------------------
@Controller('t')
class TestController {
  @Get('object')
  object() {
    return { id: 1, name: 'alpha' };
  }

  @Get('array')
  array() {
    return [{ id: 1 }, { id: 2 }];
  }

  @Get('string')
  string() {
    return 'hello';
  }

  @Get('number')
  number() {
    return 42;
  }

  @Get('zero')
  zero() {
    return 0;
  }

  @Get('false')
  falseValue() {
    return false;
  }

  @Get('null')
  nullValue() {
    return null;
  }

  @Post('created')
  @HttpCode(201)
  created() {
    return { id: 99 };
  }

  @Delete('nothing')
  @HttpCode(204)
  nothing() {
    return undefined;
  }

  @Get('void')
  voidHandler() {
    return undefined;
  }

  // shaped like EntityRepository.findMany(): meta has no itemCount
  @Get('page')
  page() {
    return {
      data: [{ id: 3 }, { id: 4 }],
      meta: { currentPage: 2, itemsPerPage: 2, totalItems: 5, totalPages: 3 },
    };
  }

  @Get('page-with-item-count')
  pageWithItemCount() {
    return {
      data: [{ id: 3 }, { id: 4 }],
      meta: { currentPage: 2, itemsPerPage: 2, totalItems: 5, totalPages: 3, itemCount: 2 },
    };
  }

  @Get('empty-page')
  emptyPage() {
    return {
      data: [],
      meta: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0, itemCount: 0 },
    };
  }

  @Get('only-data-key')
  onlyDataKey() {
    return { data: [1, 2, 3] };
  }

  @Get('file')
  file() {
    return new StreamableFile(Buffer.from('file-content'), {
      type: 'text/plain',
      disposition: 'attachment; filename="a.txt"',
    });
  }

  @Get('manual')
  manual(@Res() res: any) {
    res.status(202).json({ raw: true });
  }

  @Get('missing')
  missing() {
    throw new NotFoundException('nope');
  }
}

describe('ResponseTransformInterceptor (e2e: real Nest HTTP app)', () => {
  let app: INestApplication;
  let baseUrl: string;

  const get = (path: string) => fetch(`${baseUrl}/t/${path}`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [TestController] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
  });

  const expectRecentTimestamp = (ts: string, before: number, after: number) => {
    const ms = Date.parse(ts);
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(ms).toBeGreaterThanOrEqual(before);
    expect(ms).toBeLessThanOrEqual(after);
  };

  // -------------------------------------------------------------------------
  describe('wrapping', () => {
    it('wraps an object as JSON { timestamp, data }', async () => {
      const before = Date.now();
      const res = await get('object');
      const body = await res.json();
      const after = Date.now();

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
      expect(body.data).toEqual({ id: 1, name: 'alpha' });
      expect(Object.keys(body).sort()).toEqual(['data', 'timestamp']);
      expectRecentTimestamp(body.timestamp, before, after);
    });

    it('wraps an array', async () => {
      const body = await (await get('array')).json();

      expect(body.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(body).not.toHaveProperty('pagination');
    });

    it.each([
      ['string', 'hello'],
      ['number', 42],
      ['zero', 0],
      ['false', false],
    ])('wraps a %s result as JSON', async (path, expected) => {
      const res = await get(path);
      const body = await res.json();

      expect(res.headers.get('content-type')).toMatch(/application\/json/);
      expect(body.data).toBe(expected);
      expect(typeof body.timestamp).toBe('string');
    });

    it('wraps null as { timestamp, data: null }', async () => {
      const body = await (await get('null')).json();

      expect(body.data).toBeNull();
      expect(typeof body.timestamp).toBe('string');
    });

    it('keeps the status code chosen by the handler (201)', async () => {
      const res = await fetch(`${baseUrl}/t/created`, { method: 'POST' });

      expect(res.status).toBe(201);
      expect((await res.json()).data).toEqual({ id: 99 });
    });

    it('a handler returning nothing still answers with a timestamp and no data', async () => {
      const body = await (await get('void')).json();

      expect(typeof body.timestamp).toBe('string');
      expect(body).not.toHaveProperty('data');
    });

    it('a 204 stays a 204 with an empty body', async () => {
      const res = await fetch(`${baseUrl}/t/nothing`, { method: 'DELETE' });

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
    });

    it('does not unwrap an object that merely has a "data" key', async () => {
      const body = await (await get('only-data-key')).json();

      expect(body.data).toEqual({ data: [1, 2, 3] });
      expect(body).not.toHaveProperty('pagination');
    });

    it('produces a different timestamp per request', async () => {
      const a = await (await get('object')).json();
      await new Promise((r) => setTimeout(r, 5));
      const b = await (await get('object')).json();

      expect(Date.parse(b.timestamp)).toBeGreaterThan(Date.parse(a.timestamp));
    });
  });

  // -------------------------------------------------------------------------
  describe('pagination', () => {
    it('unwraps { data, meta } into data + pagination', async () => {
      const body = await (await get('page-with-item-count')).json();

      expect(body.data).toEqual([{ id: 3 }, { id: 4 }]);
      expect(body.pagination).toEqual({
        totalItems: 5,
        itemCount: 2,
        itemsPerPage: 2,
        totalPages: 3,
        currentPage: 2,
      });
      expect(body).not.toHaveProperty('meta');
    });

    it('returns pagination with zeros for an empty page', async () => {
      const body = await (await get('empty-page')).json();

      expect(body.data).toEqual([]);
      expect(body.pagination).toEqual({
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 0,
        currentPage: 1,
      });
    });

    // The repositories' metadata has no itemCount, but the documented response does
    // (pagination.itemCount = items in this page).
    it('includes itemCount in the pagination of a repository-shaped result', async () => {
      const body = await (await get('page')).json();

      expect(body.pagination.itemCount).toBe(2);
      expect(body.pagination).toEqual({
        totalItems: 5,
        itemCount: 2,
        itemsPerPage: 2,
        totalPages: 3,
        currentPage: 2,
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('responses that are not wrapped', () => {
    it('streams a StreamableFile as-is, with its own headers', async () => {
      const res = await get('file');

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('text/plain');
      expect(res.headers.get('content-disposition')).toBe('attachment; filename="a.txt"');
      expect(await res.text()).toBe('file-content');
    });

    it('leaves a response the handler wrote itself with @Res() alone', async () => {
      const res = await get('manual');

      expect(res.status).toBe(202);
      expect(await res.json()).toEqual({ raw: true });
    });

    it('does not wrap errors: the exception filter response is unchanged', async () => {
      const res = await get('missing');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toMatchObject({ statusCode: 404, message: 'nope' });
      expect(body).not.toHaveProperty('timestamp');
      expect(body).not.toHaveProperty('data');
    });

    it('does not wrap the 404 of an unknown route', async () => {
      const res = await fetch(`${baseUrl}/t/does-not-exist`);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).not.toHaveProperty('data');
    });
  });
});
