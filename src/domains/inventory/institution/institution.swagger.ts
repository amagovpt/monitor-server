import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiParam 
} from "@nestjs/swagger";
import { InstitutionResponseDTO } from "./dto/institution-response.dto";
import { Website } from "src/domains/inventory/website/website.entity";
import { Page } from "src/domains/inventory/page/page.entity";

export const InstitutionDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("institution"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  reEvaluate: () =>
    applyDecorators(
      ApiOperation({ summary: "Reevaluate all pages from an institution list" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  totalObservatory: () =>
    applyDecorators(
      ApiOperation({ summary: "Find number of entities in Observatory" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  count: () =>
    applyDecorators(
      ApiOperation({ summary: "Find institution by search term in AMS" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  findAllPaged: () =>
    applyDecorators(
      ApiOperation({
        summary: "List institutions with pagination, sorting and search filters",
      }),
      ApiResponse({ status: 200, description: "Paginated list of institutions retrieved successfully", type: [InstitutionResponseDTO] }),
      ApiResponse({ status: 400, description: "Invalid query parameters" }),
      HttpCode(200)
    ),

  info: () =>
    applyDecorators(
      ApiOperation({ summary: "Find institution info by id" }),
      ApiParam({ name: "institutionId", type: Number, required: true, description: "Unique identifier of the institution" }),
      ApiResponse({ status: 200, description: "Institution retrieved successfully", type: InstitutionResponseDTO }),
      ApiResponse({ status: 400, description: "Invalid institution ID" }),
      ApiResponse({ status: 404, description: "Institution not found" }),
      HttpCode(200)
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new institution" }),
      ApiResponse({ status: 201, description: "A new institution was created", type: InstitutionResponseDTO }),
      ApiResponse({ status: 400, description: "Invalid request payload" }),
      HttpCode(201)
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: "Update a specific institution" }),
      ApiResponse({ status: 200, description: "The institution was updated", type: Boolean }),
      ApiResponse({ status: 400, description: "Invalid request payload" }),
      ApiResponse({ status: 500, description: "Internal Server Error - Update failed" }),
      HttpCode(200)
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a specific institution" }),
      ApiResponse({ status: 200, description: "The institution was deleted" }),
      ApiResponse({ status: 400, description: "Invalid request payload" }),
      HttpCode(200)
    ),

  deleteBulk: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a list of entities" }),
      ApiResponse({ status: 200, description: "The institution list was deleted", type: Boolean }),
      HttpCode(200)
    ),

  deletePagesBulk: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete all pages from a list of entities" }),
      ApiResponse({ status: 200, description: "The page list was deleted", type: Boolean }),
      HttpCode(200)
    ),

  existsShortName: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if institution exists by short-name" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  existsLongName: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if institution exists by long-name" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  websites: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all the websites in a specific institution" }),
      ApiResponse({ status: 200, description: "Success", type: [Website] }),
      HttpCode(200)
    ),

  pages: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all the pages in a specific institution" }),
      ApiResponse({ status: 200, description: "Success", type: [Page] }),
      HttpCode(200)
    ),
};
