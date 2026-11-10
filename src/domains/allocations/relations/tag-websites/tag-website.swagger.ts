import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateWebsiteTagsDto } from "./dtos/tag-website-update.dto"; 
import { TagWebsiteResponseDTO } from "./dtos/tag-websites-response.dto";

export const TagWebsitesDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("tag-websites"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized - Missing or invalid authentication token" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires Admin role and FGA authorization" })
    ),

  getWebsiteTags: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Get tags associated with a website",
        description: "Retrieves the list of tags currently associated with the specified website."
      }),
      ApiParam({ 
        name: "websiteId", 
        type: Number, 
        required: true,
        description: "Unique identifier of the website" 
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "List of tags successfully retrieved",
        type: [TagWebsiteResponseDTO]
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid website ID (must be an integer)" 
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

  updateWebsiteTags: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update tags associated with a website",
        description: "Atomically adds and/or removes tags for the specified website."
      }),
      ApiParam({ 
        name: "websiteId", 
        type: Number, 
        required: true,
        description: "Unique identifier of the website" 
      }),
      ApiBody({ 
        type: UpdateWebsiteTagsDto,
        description: "Arrays of tag IDs to add and remove"
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "Tags successfully updated for the website" 
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid website ID or invalid request payload" 
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
