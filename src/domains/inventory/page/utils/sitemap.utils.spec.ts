import { BadRequestException } from '@nestjs/common';
import { extractSitemapUrls, filterByOrigin } from './sitemap.utils';

describe('sitemap.utils', () => {
  describe('extractSitemapUrls', () => {
    describe('XML sitemap', () => {
      it('should extract all <loc> values from a urlset', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/</loc></url>
            <url><loc>https://example.com/a</loc><lastmod>2024-01-01</lastmod></url>
            <url><loc>https://example.com/b</loc></url>
          </urlset>`;

        expect(extractSitemapUrls(xml)).toEqual([
          'https://example.com/',
          'https://example.com/a',
          'https://example.com/b',
        ]);
      });

      it('should handle a urlset with a single <url>', () => {
        const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/only</loc></url>
          </urlset>`;

        expect(extractSitemapUrls(xml)).toEqual(['https://example.com/only']);
      });

      it('should ignore namespaced extensions like xhtml:link and image:image', () => {
        const xml = `<urlset
            xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:xhtml="http://www.w3.org/1999/xhtml"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
            <url>
              <loc>https://example.com/pt</loc>
              <xhtml:link rel="alternate" hreflang="en" href="https://example.com/en"/>
              <image:image><image:loc>https://example.com/img.png</image:loc></image:image>
            </url>
          </urlset>`;

        expect(extractSitemapUrls(xml)).toEqual(['https://example.com/pt']);
      });

      it('should strip a leading BOM', () => {
        const xml = `\uFEFF<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/bom</loc></url>
          </urlset>`;

        expect(extractSitemapUrls(xml)).toEqual(['https://example.com/bom']);
      });

      it('should skip <url> entries without <loc>', () => {
        const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><lastmod>2024-01-01</lastmod></url>
            <url><loc>https://example.com/valid</loc></url>
          </urlset>`;

        expect(extractSitemapUrls(xml)).toEqual(['https://example.com/valid']);
      });

      it('should reject sitemap index files', () => {
        const xml = `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
          </sitemapindex>`;

        expect(() => extractSitemapUrls(xml)).toThrow(BadRequestException);
        expect(() => extractSitemapUrls(xml)).toThrow('Sitemap index files are not supported');
      });

      it('should reject XML that is not a sitemap', () => {
        const xml = '<html><body><p>hello</p></body></html>';

        expect(() => extractSitemapUrls(xml)).toThrow(BadRequestException);
        expect(() => extractSitemapUrls(xml)).toThrow('<urlset> missing');
      });
    });

    describe('TXT sitemap', () => {
      it('should return one URL per line', () => {
        const txt = 'https://example.com/a\nhttps://example.com/b\nhttps://example.com/c';

        expect(extractSitemapUrls(txt)).toEqual([
          'https://example.com/a',
          'https://example.com/b',
          'https://example.com/c',
        ]);
      });

      it('should support CRLF line endings', () => {
        const txt = 'https://example.com/a\r\nhttps://example.com/b\r\n';

        expect(extractSitemapUrls(txt)).toEqual(['https://example.com/a', 'https://example.com/b']);
      });

      it('should trim lines and ignore blank lines', () => {
        const txt = '  https://example.com/a  \n\n   \n\thttps://example.com/b\t\n';

        expect(extractSitemapUrls(txt)).toEqual(['https://example.com/a', 'https://example.com/b']);
      });

      it('should ignore comment lines starting with #', () => {
        const txt =
          '# my sitemap\nhttps://example.com/a\n  # another comment\nhttps://example.com/b';

        expect(extractSitemapUrls(txt)).toEqual(['https://example.com/a', 'https://example.com/b']);
      });

      it('should strip a leading BOM', () => {
        const txt = '\uFEFFhttps://example.com/a\nhttps://example.com/b';

        expect(extractSitemapUrls(txt)).toEqual(['https://example.com/a', 'https://example.com/b']);
      });

      it('should return an empty array for empty content', () => {
        expect(extractSitemapUrls('')).toEqual([]);
        expect(extractSitemapUrls('   \n  \n')).toEqual([]);
      });
    });
  });

  describe('filterByOrigin', () => {
    const origin = 'https://example.com';

    it('should accept URLs from the same origin', () => {
      const result = filterByOrigin(['https://example.com/a', 'https://example.com/b?x=1'], origin);

      expect(result).toEqual({
        urls: ['https://example.com/a', 'https://example.com/b?x=1'],
        invalid: 0,
        otherOrigin: 0,
        duplicates: 0,
      });
    });

    it('should count URLs from other origins', () => {
      const result = filterByOrigin(
        [
          'https://other.com/a',
          'https://sub.example.com/a', // different subdomain
          'http://example.com/a', // different protocol
          'https://example.com:8443/a', // different port
          'https://example.com/ok',
        ],
        origin,
      );

      expect(result.urls).toEqual(['https://example.com/ok']);
      expect(result.otherOrigin).toBe(4);
      expect(result.invalid).toBe(0);
      expect(result.duplicates).toBe(0);
    });

    it('should count invalid URLs', () => {
      const result = filterByOrigin(
        [
          'not a url',
          '/relative/path',
          'ftp://example.com/file',
          'mailto:someone@example.com',
          'https://example.com/ok',
        ],
        origin,
      );

      expect(result.urls).toEqual(['https://example.com/ok']);
      expect(result.invalid).toBe(4);
      expect(result.otherOrigin).toBe(0);
    });

    it('should count exact duplicates', () => {
      const result = filterByOrigin(
        ['https://example.com/a', 'https://example.com/a', 'https://example.com/a'],
        origin,
      );

      expect(result.urls).toEqual(['https://example.com/a']);
      expect(result.duplicates).toBe(2);
    });

    it('should treat URLs differing only by hash as duplicates', () => {
      const result = filterByOrigin(
        ['https://example.com/a', 'https://example.com/a#section', 'https://example.com/a#other'],
        origin,
      );

      expect(result.urls).toEqual(['https://example.com/a']);
      expect(result.duplicates).toBe(2);
    });

    it('should strip the hash from accepted URLs', () => {
      const result = filterByOrigin(['https://example.com/a#section'], origin);

      expect(result.urls).toEqual(['https://example.com/a']);
    });

    it('should normalize URLs (trim whitespace and add trailing slash to bare origin)', () => {
      const result = filterByOrigin(['  https://example.com  ', 'https://example.com/'], origin);

      expect(result.urls).toEqual(['https://example.com/']);
      expect(result.duplicates).toBe(1);
    });

    it('should keep URLs that differ by query string', () => {
      const result = filterByOrigin(
        ['https://example.com/a?x=1', 'https://example.com/a?x=2'],
        origin,
      );

      expect(result.urls).toEqual(['https://example.com/a?x=1', 'https://example.com/a?x=2']);
      expect(result.duplicates).toBe(0);
    });

    it('should preserve the order of first occurrence', () => {
      const result = filterByOrigin(
        [
          'https://example.com/c',
          'https://example.com/a',
          'https://example.com/c',
          'https://example.com/b',
        ],
        origin,
      );

      expect(result.urls).toEqual([
        'https://example.com/c',
        'https://example.com/a',
        'https://example.com/b',
      ]);
    });

    it('should return zeroed counters for an empty list', () => {
      expect(filterByOrigin([], origin)).toEqual({
        urls: [],
        invalid: 0,
        otherOrigin: 0,
        duplicates: 0,
      });
    });

    it('should report all counters together on mixed input', () => {
      const result = filterByOrigin(
        [
          'https://example.com/a',
          'https://example.com/a#dup',
          'https://other.com/x',
          'garbage',
          'https://example.com/b',
        ],
        origin,
      );

      expect(result).toEqual({
        urls: ['https://example.com/a', 'https://example.com/b'],
        invalid: 1,
        otherOrigin: 1,
        duplicates: 1,
      });
    });
  });
});
