import { BadRequestException, Injectable } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

const SITEMAP_FIELD_NAME = 'file';
const SITEMAP_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['text/xml', 'application/xml', 'text/plain'];
const ALLOWED_EXTENSIONS = ['.xml', '.txt'];

const SitemapFileInterceptorBase = FileInterceptor(SITEMAP_FIELD_NAME, {
  limits: { fileSize: SITEMAP_MAX_SIZE_BYTES },
  fileFilter: (
    _req: unknown,
    file: { originalname: string; mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const name = file.originalname.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
    const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype);

    if (!hasValidExtension && !hasValidMimeType) {
      return callback(
        new BadRequestException('Only sitemap (xml) or txt files are allowed'),
        false,
      );
    }

    callback(null, true);
  },
});

/**
 * Interceptor responsible for receiving the sitemap (xml) or txt file
 * sent in the multipart field `file`.
 */
@Injectable()
export class FileSitemapInterceptor extends SitemapFileInterceptorBase {}
