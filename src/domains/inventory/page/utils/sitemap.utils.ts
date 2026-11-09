import { BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

export const SITEMAP_MAX_URLS = 50_000;

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true, // xhtml:link, image:image, etc.
  isArray: (name) => name === 'url' || name === 'sitemap', // 1 só <url> também vira array
});

export function extractSitemapUrls(content: string): string[] {
  const text = content.replace(/^\uFEFF/, '').trim();

  if (text.startsWith('<')) {
    let parsed: any;
    try {
      parsed = xmlParser.parse(text);
    } catch {
      throw new BadRequestException('Invalid XML sitemap');
    }

    if (parsed?.sitemapindex) {
      throw new BadRequestException(
        'Sitemap index files are not supported. Upload the child sitemaps instead.',
      );
    }
    if (!parsed?.urlset) {
      throw new BadRequestException('XML does not look like a sitemap (<urlset> missing)');
    }

    return (parsed.urlset.url ?? [])
      .map((u: { loc?: unknown }) => u?.loc)
      .filter((loc: unknown): loc is string => typeof loc === 'string');
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

export interface FilterResult {
  urls: string[];
  invalid: number;
  otherOrigin: number;
  duplicates: number;
}

export function filterByOrigin(rawUrls: string[], origin: string): FilterResult {
  const accepted = new Set<string>();
  let invalid = 0;
  let otherOrigin = 0;
  let duplicates = 0;

  for (const raw of rawUrls) {
    let url: URL;
    try {
      url = new URL(raw.trim());
    } catch {
      invalid++;
      continue;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      invalid++;
      continue;
    }

    if (url.origin !== origin) {
      otherOrigin++;
      continue;
    }

    url.hash = '';
    const normalized = url.toString();

    if (accepted.has(normalized)) {
      duplicates++;
      continue;
    }
    accepted.add(normalized);
  }

  return { urls: [...accepted], invalid, otherOrigin, duplicates };
}
