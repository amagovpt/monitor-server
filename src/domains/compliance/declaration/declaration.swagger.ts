import { applyDecorators } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth,
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateDeclarationDto } from "./dto/update-declaration.dto";

export const DeclarationDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("websites declarations"),
      ApiBearerAuth(),
      ApiResponse({ status: 401, description: "Unauthorized" }),
      ApiResponse({ status: 403, description: "Forbidden (Insufficient permissions)" }),
      ApiResponse({ status: 404, description: "Website not found" })
    ),

  getDeclaration: () =>
    applyDecorators(
      ApiOperation({ summary: "Get declaration by website ID" }),
      ApiParam({ name: "websiteId", type: Number, required: true, description: "Website unique identifier" }),
      ApiResponse({ 
        status: 200, 
        description: "Declaration successfully retrieved" 
      }),
      ApiResponse({ status: 400, description: "Bad Request - Invalid website ID" })
    ),

  upsertDeclaration: () =>
    applyDecorators(
      ApiOperation({ summary: "Create or update declaration for a website" }),
      ApiParam({ name: "websiteId", type: Number, required: true, description: "Website unique identifier" }),
      ApiBody({ type: UpdateDeclarationDto }),
      ApiResponse({ 
        status: 200, 
        description: "Declaration successfully upserted" 
      }),
      ApiResponse({ status: 400, description: "Bad Request - Validation error" })
    )
};
