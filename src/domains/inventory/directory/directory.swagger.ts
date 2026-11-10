import { applyDecorators } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth,
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { DirectoryDTO } from "./dto/directory.dto";
import { CreateDirectory } from "./dto/create-diretory.dto";
import { UpdateDirectory } from "./dto/update-diretory.dto";

export const DirectoryDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("directories"),
      ApiBearerAuth(), 
      ApiResponse({ status: 401, description: "Unauthorized" }),
      ApiResponse({ status: 403, description: "Forbidden (Insufficient permissions)" })
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: "Get all directories with pagination and filters" }),
      ApiResponse({ 
        status: 200, 
        description: "Paginated list of directories successfully retrieved", 
      })
    ),

  getDirectory: () =>
    applyDecorators(
      ApiOperation({ summary: "Get a specific directory by ID" }),
      ApiParam({ name: "directoryId", type: Number, required: true, description: "Directory unique identifier" }),
      ApiResponse({ status: 200, description: "Directory retrieved successfully", type: DirectoryDTO }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid directory ID" }),
      ApiResponse({ status: 404, description: "Directory not found" })
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create a new directory" }),
      ApiBody({ type: CreateDirectory }),
      ApiResponse({ status: 201, description: "Directory successfully created", type: DirectoryDTO }),
      ApiResponse({ status: 400, description: "Bad Request - Validation error" })
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: "Update a specific directory" }),
      ApiBody({ type: UpdateDirectory }),
      ApiResponse({ status: 200, description: "Directory successfully updated", type: DirectoryDTO }),
      ApiResponse({ status: 404, description: "Directory not found" })
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete a specific directory" }),
      ApiParam({ name: "directoryId", type: Number, required: true, description: "Directory unique identifier" }),
      ApiResponse({ status: 204, description: "Directory successfully deleted" }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid directory ID" }),
      ApiResponse({ status: 404, description: "Directory not found" })
    ),
};
