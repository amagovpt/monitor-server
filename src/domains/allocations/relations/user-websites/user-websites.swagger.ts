import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateUserWebsitesDto } from "./dtos/user-website-update.dto";
import { UserWebsiteResponseDTO } from "./dtos/user-websites-response.dto";

export const UserWebsitesDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("user-websites"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized - Missing or invalid authentication token" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires FGA authorization" })
    ),

  getUserWebsites: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Get websites allocated to a user",
        description: "Retrieves the list of websites currently assigned to the specified user."
      }),
      ApiParam({ name: "userId", type: Number, required: true, description: "Unique identifier of the user" }),
      ApiResponse({ status: HttpStatus.OK, description: "List of websites successfully retrieved", type: [UserWebsiteResponseDTO] }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid user ID (must be an integer)" }),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized - Missing or invalid authentication token" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires FGA viewer authorization" })
    ),

  updateUserWebsites: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update websites allocated to a user",
        description: "Atomically adds and/or removes website assignments for the specified user."
      }),
      ApiParam({ name: "userId", type: Number, required: true, description: "Unique identifier of the user" }),
      ApiBody({ type: UpdateUserWebsitesDto, description: "Arrays of website IDs to add and remove" }),
      ApiResponse({ status: HttpStatus.OK, description: "Website allocations successfully updated" }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid user ID or invalid request payload" }),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized - Missing or invalid authentication token" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires Admin role and FGA editor authorization" })
    ),
};
