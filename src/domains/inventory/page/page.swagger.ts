import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { Page } from './page.entity';
import { UpdatePageContextDto } from './dto/update.page-context.dto';
import { CreatePageDto } from './dto/create-page.dto';
import { DeletePagesDto } from './dto/delete-page.dto';

export const PageDocs = {
  controller: () =>
    applyDecorators(
      ApiTags('Pages'),
      ApiBearerAuth(),
      ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid JWT token' }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient RBAC or ReBAC (OpenFGA) permissions',
      }),
    ),

  find: () =>
    applyDecorators(
      ApiOperation({
        summary: 'List pages filtered by context',
        description:
          'Returns a paginated list of pages according to the provided filters, sorting and the contexts the user is authorized for.',
      }),
      ApiResponse({
        status: 200,
        description: 'Paginated list of pages retrieved successfully',
        type: [Page],
      }),
      ApiResponse({ status: 400, description: 'Invalid query parameters' }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get details of a specific page of a website',
        description: 'Requires read permission on the website in OpenFGA (`website:can_view`).',
      }),
      ApiParam({
        name: 'websiteId',
        type: Number,
        required: true,
        description: 'ID of the owning website',
        example: 10,
      }),
      ApiParam({
        name: 'pageId',
        type: Number,
        required: true,
        description: 'ID of the page',
        example: 42,
      }),
      ApiResponse({
        status: 200,
        description: 'Page retrieved successfully',
        type: Page,
      }),
      ApiResponse({ status: 404, description: 'Page or website not found' }),
    ),

  create: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Create a new page on a website',
        description: 'Requires edit permission on the website in OpenFGA (`website:can_edit`).',
      }),
      ApiParam({
        name: 'websiteId',
        type: Number,
        required: true,
        description: 'ID of the website where the page will be created',
        example: 10,
      }),
      ApiBody({ type: CreatePageDto }),
      ApiResponse({
        status: 201,
        description: 'Page created successfully',
        type: Page,
      }),
      ApiResponse({ status: 400, description: 'Invalid data or duplicate URL' }),
    ),

  createFromSitemap: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Create pages on a website from a sitemap file',
        description:
          'Receives a sitemap (xml) or txt file (one URL per line) and creates the pages on the website. Requires edit permission on the website in OpenFGA (`website:can_edit`).',
      }),
      ApiConsumes('multipart/form-data'),
      ApiParam({
        name: 'websiteId',
        type: Number,
        required: true,
        description: 'ID of the website where the pages will be created',
        example: 10,
      }),
      ApiBody({
        required: true,
        description: 'Sitemap (xml) or txt file sent in the multipart field `file` (max 5MB)',
        schema: {
          type: 'object',
          required: ['file'],
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Sitemap (.xml) or text (.txt) file',
            },
          },
        },
      }),
      ApiResponse({
        status: 201,
        description: 'Pages created successfully from the sitemap',
      }),
      ApiResponse({
        status: 400,
        description: 'File missing, invalid file type, file too large or invalid sitemap content',
      }),
      ApiResponse({ status: 404, description: 'Website not found' }),
    ),

  bulkDelete: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Bulk remove pages or detach contexts',
        description:
          'Removes the context allocation associated with the user role. If the page has no remaining context allocated, it is permanently deleted.',
      }),
      ApiBody({ type: DeletePagesDto }),
      ApiResponse({
        status: 200,
        description: 'Pages processed/removed successfully',
      }),
      ApiResponse({
        status: 400,
        description: 'User role has no associated context or invalid payload',
      }),
    ),

  changePageContext: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Change the contexts assigned to a set of pages',
        description:
          'Bulk update of contexts (e.g. Study Monitor, My Monitor) for the provided page IDs.',
      }),
      ApiBody({
        type: UpdatePageContextDto,
        description: 'Payload containing the list of pageIds and the new contexts',
      }),
      ApiResponse({
        status: 200,
        description: 'Contexts updated successfully',
      }),
      ApiResponse({ status: 400, description: 'Invalid context or page data' }),
    ),

  toggleObservatoryStatus: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Toggle the Observatory status of a page',
        description:
          'Enables or disables the Observatory flag for the specified page of a website.',
      }),
      ApiParam({
        name: 'websiteId',
        type: Number,
        required: true,
        description: 'ID of the owning website',
        example: 10,
      }),
      ApiParam({
        name: 'pageId',
        type: Number,
        required: true,
        description: 'ID of the page',
        example: 42,
      }),
      ApiResponse({
        status: 201,
        description: 'Observatory status toggled successfully',
      }),
      ApiResponse({ status: 400, description: 'Invalid website or page ID' }),
      ApiResponse({ status: 404, description: 'Page or website not found' }),
    ),
};
