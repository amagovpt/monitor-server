import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiParam, ApiBearerAuth } from "@nestjs/swagger";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { UpdateWebsiteDto } from "./dto/update-website.dto";
import { DeleteBulkWebsiteDto } from "./dto/delete-bulk-website.dto";
import { UpdateUrlWebsiteDto } from "./dto/update-url-website.dto";
import { UpdateWebsiteContextDto } from "./dto/update.website-context.dto";


export const WebsiteDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("websites"),
      ApiBearerAuth(),
      
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: "List websites with pagination and security filters" }),
      ApiResponse({ status: 200, description: "Paginated list of websites retrieved successfully" }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid query parameters" })
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({ summary: "Get detailed website information" }),
      ApiParam({ name: "websiteId", type: Number, required: true, description: "Unique identifier of the website" }),
      ApiResponse({ status: 200, description: "Website retrieved successfully" }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid website ID" }),
      ApiResponse({ status: 404, description: "Website not found" })
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new website" }),
      ApiBody({ type: CreateWebsiteDto }),
      ApiResponse({ status: 201, description: "Website created successfully", type: CreateWebsiteDto }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid input data" }),
     ApiResponse({ status: 403, description: "Forbidden - Insufficient permissions" }),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({
        summary: "Update website metadata and permissions",
        description: "Update the details and permissions of an existing website"
      }),
      ApiParam({ name: "websiteId", type: Number, required: true, description: "Unique identifier of the website" }),
      ApiBody({ type: UpdateWebsiteDto }),
      ApiResponse({
        status: 200,
        description: "Website updated successfully",
      }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid input data" }),
      ApiResponse({ status: 404, description: "Website not found" })
    ),
    delete: () =>
    applyDecorators(
      ApiOperation({
        summary: "Delete one or more websites",
        description: "Permanently delete websites that the user has permission to edit"
      }),
      ApiBody({ type: DeleteBulkWebsiteDto }),
      ApiResponse({
        status: 200,
        description: "Websites deleted successfully",
      }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid payload" }),
      ApiResponse({ status: 403, description: "Forbidden - Insufficient permissions" }),
    ),

  changeWebsiteUrl: () =>
    applyDecorators(
      ApiOperation({
        summary: "Change the base URL of a website",
        description: "Updates the base URL of an existing website that the user has permission to edit"
      }),
      ApiParam({ name: "websiteId", type: Number, required: true, description: "Unique identifier of the website" }),
      ApiBody({ type: UpdateUrlWebsiteDto }),
      ApiResponse({ status: 200, description: "Website URL updated successfully" }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid input data" }),
      ApiResponse({ status: 404, description: "Website not found" })
    ),

  changeWebsiteContexts: () =>
    applyDecorators(
      ApiOperation({
        summary: "Change the contexts assigned to a website",
        description: "Replaces the contexts associated with an existing website"
      }),
      ApiParam({ name: "websiteId", type: Number, required: true, description: "Unique identifier of the website" }),
      ApiBody({ type: UpdateWebsiteContextDto }),
      ApiResponse({ status: 201, description: "Website contexts updated successfully" }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid input data" }),
      ApiResponse({ status: 404, description: "Website not found" })
    ),
};
