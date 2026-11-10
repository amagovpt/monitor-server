import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiParam 
} from "@nestjs/swagger";

export const AccessibilityStatementDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("accessibility-statement"),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: "List accessibility statements with pagination and filters" }),
      ApiResponse({ status: 200, description: "Paginated list of accessibility statements retrieved successfully" }),
      ApiResponse({ status: 400, description: "Invalid query parameters" }),
      HttpCode(200)
    ),

  findOneById: () =>
    applyDecorators(
      ApiOperation({ summary: "Get an accessibility statement by ID" }),
      ApiParam({ name: "id", type: Number, required: true, description: "Unique identifier of the accessibility statement" }),
      ApiResponse({ status: 200, description: "Accessibility statement retrieved successfully" }),
      ApiResponse({ status: 400, description: "Invalid ID (must be an integer)" }),
      ApiResponse({ status: 404, description: "Accessibility statement not found" }),
      HttpCode(200)
    ),

  upsert: () =>
    applyDecorators(
      ApiOperation({ summary: "Create or update an accessibility statement" }),
      ApiResponse({ status: 200, description: "Accessibility statement successfully upserted" }),
      ApiResponse({ status: 400, description: "Invalid request payload" }),
      HttpCode(200)
    ),

  deleteById: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete an accessibility statement by ID" }),
      ApiParam({ name: "id", type: Number, required: true, description: "Unique identifier of the accessibility statement" }),
      ApiResponse({ status: 204, description: "Accessibility statement successfully deleted" }),
      ApiResponse({ status: 400, description: "Invalid ID (must be an integer)" }),
      ApiResponse({ status: 404, description: "Accessibility statement not found" }),
      HttpCode(204)
    ),

  findAllByYear: () =>
    applyDecorators(
      ApiOperation({ summary: "Get accessibility statements grouped by age/year" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByConformance: () =>
    applyDecorators(
      ApiOperation({ summary: "Get accessibility statements grouped by conformance" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllBySeal: () =>
    applyDecorators(
      ApiOperation({ summary: "Get accessibility statements grouped by seal" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByState: () =>
    applyDecorators(
      ApiOperation({ summary: "Get accessibility statements grouped by state" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByDirectoryState: () =>
    applyDecorators(
      ApiOperation({ summary: "Get directory accessibility statements grouped by state" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByDirectorySeal: () =>
    applyDecorators(
      ApiOperation({ summary: "Get directory accessibility statements grouped by seal" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByDirectoryConformity: () =>
    applyDecorators(
      ApiOperation({ summary: "Get directory accessibility statements grouped by conformity" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findAllByDirectoryWebsite: () =>
    applyDecorators(
      ApiOperation({ summary: "Get OPAW table for directory websites" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),

  findNumberOfEvaluationByType: () =>
    applyDecorators(
      ApiOperation({ summary: "Get number of evaluations grouped by type" }),
      ApiResponse({ status: 200, description: "Success" }),
      HttpCode(200)
    ),
};
