import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateDirectoryTagsDto } from "./dtos/directory-tags-update.dto"; 
import { DirectoryTagResponseDTO } from "./dtos/directory-tags-response.dto";

export const DirectoryTagsDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("directory-tags"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized - Missing or invalid authentication token" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires Admin role and FGA authorization" })
    ),

  getDirectoryTags: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Get tags associated with a directory",
        description: "Retrieves the list of tags currently associated with the specified directory."
      }),
      ApiParam({ 
        name: "directoryId", 
        type: Number, 
        required: true,
        description: "Unique identifier of the directory" 
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "List of tags successfully retrieved",
        type: [DirectoryTagResponseDTO]
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid directory ID (must be an integer)" 
      }),
      ApiResponse({ 
        status: HttpStatus.UNAUTHORIZED, 
        description: "Unauthorized - Missing or invalid authentication token" 
      }),
      ApiResponse({ 
        status: HttpStatus.FORBIDDEN, 
        description: "Forbidden - Requires Admin role and FGA viewer authorization" 
      })
    ),

  updateDirectoryTags: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update tags associated with a directory",
        description: "Atomically adds and/or removes tags for the specified directory."
      }),
      ApiParam({ 
        name: "directoryId", 
        type: Number, 
        required: true,
        description: "Unique identifier of the directory" 
      }),
      ApiBody({ 
        type: UpdateDirectoryTagsDto,
        description: "Arrays of tag IDs to add and remove"
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "Tags successfully updated for the directory" 
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid directory ID or invalid request payload" 
      }),
      ApiResponse({ 
        status: HttpStatus.UNAUTHORIZED, 
        description: "Unauthorized - Missing or invalid authentication token" 
      }),
      ApiResponse({ 
        status: HttpStatus.FORBIDDEN, 
        description: "Forbidden - Requires Admin role and FGA editor authorization" 
      })
    ),
};
