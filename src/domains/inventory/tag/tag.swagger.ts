import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiQuery,
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { TagResponseDTO } from "./dto/tag-response.dto";
import { TagRequestDTO } from "./dto/request/tag-request.dto";
import { CreateTagDTO } from "./dto/create-tag.dto";
import { UpdateTagDTO } from "./dto/update-tag.dto";

export const TagDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("tag"),
      ApiBasicAuth(),
      ApiResponse({ status: 401, description: "Unauthorized" }),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  findAll: () =>
    applyDecorators(
      ApiQuery({ type: TagRequestDTO }),
      ApiOperation({ summary: "List tags based on user permissions and search terms" }),
      ApiResponse({ status: 200, description: "Paginated list of tags retrieved successfully", type: [TagResponseDTO] }),
      ApiResponse({ status: 400, description: "Invalid query parameters" })
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({ summary: "Get a specific tag by ID" }),
      ApiParam({ name: "id", type: Number, required: true, description: "Unique identifier of the tag" }),
      ApiResponse({ status: 200, description: "Tag retrieved successfully", type: TagResponseDTO }),
      ApiResponse({ status: 404, description: "Tag not found" })
    ),

  create: () =>
    applyDecorators(
      ApiBody({ type: CreateTagDTO }),
      ApiOperation({ summary: "Create a new tag with optional multi-entity mappings" }),
      ApiResponse({ status: 201, description: "The tag was successfully created", type: TagResponseDTO }),
      ApiResponse({ status: 400, description: "Invalid request payload" })
    ),

  update: () =>
    applyDecorators(
      ApiBody({ type: UpdateTagDTO }),
      ApiOperation({ summary: "Update a specific tag description/meta" }),
      ApiResponse({ status: 200, description: "The tag was updated", type: TagResponseDTO }),
      ApiResponse({ status: 400, description: "Invalid request payload" }),
      ApiResponse({ status: 404, description: "Tag not found" })
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a specific tag" }),
      ApiParam({ name: "id", type: Number, required: true, description: "Unique identifier of the tag" }),
      ApiResponse({ status: 204, description: "The tag was deleted successfully" }),
      ApiResponse({ status: 400, description: "Invalid tag ID or entity constraint block" }),
      ApiResponse({ status: 404, description: "Tag not found" })
    ),
};
