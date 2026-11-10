import { applyDecorators } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth,
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateStampDto } from "./dto/update-stamp.dto";

export const StampDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("websites stamps"),
      ApiBearerAuth(),
      ApiResponse({ status: 401, description: "Unauthorized" }),
      ApiResponse({ status: 403, description: "Forbidden (Insufficient permissions)" }),
      ApiResponse({ status: 404, description: "Website not found" })
    ),

  getStamp: () =>
    applyDecorators(
      ApiOperation({ summary: "Get stamp by website ID" }),
      ApiParam({ name: "websiteId", type: Number, required: true, description: "Website unique identifier" }),
      ApiResponse({ 
        status: 200, 
        description: "Stamp successfully retrieved" 
      }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid website ID" })
    ),

  upsertStamp: () =>
    applyDecorators(
      ApiOperation({ summary: "Create or update stamp for a website" }),
      ApiParam({ name: "websiteId", type: Number, required: true, description: "Website unique identifier" }),
      ApiBody({ type: UpdateStampDto }),
      ApiResponse({ 
        status: 200, 
        description: "Stamp successfully upserted" 
      }),
      ApiResponse({ status: 400, description: "Bad Request - Validation error" })
    )
};
