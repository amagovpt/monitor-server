import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateTeamWebsitesDto } from "./dtos/team-website-update.dto";
import { TeamWebsiteResponseDTO } from "./dtos/team-websites-response.dto";

export const TeamWebsitesDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("team-websites"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized - Missing or invalid authentication token" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires FGA authorization" })
    ),
  getTeamWebsites: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Get websites allocated to a team",
        description: "Retrieves the list of websites currently allocated to the specified team."
      }),
      ApiParam({ 
        name: "teamId", 
        type: Number, 
        required: true,
        description: "Unique identifier of the team" 
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "List of websites successfully retrieved for the team",
        type: [TeamWebsiteResponseDTO]
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid team ID (must be an integer)" 
      }),
      ApiResponse({ 
        status: HttpStatus.UNAUTHORIZED, 
        description: "Unauthorized - Missing or invalid authentication token" 
      }),
      ApiResponse({ 
        status: HttpStatus.FORBIDDEN, 
        description: "Forbidden - Requires FGA viewer authorization" 
      })
    ),
  updateTeamWebsites: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update websites allocated to a team",
        description: "Atomically adds and/or removes websites from the specified team's allocation list."
      }),
      ApiParam({ 
        name: "teamId", 
        type: Number, 
        required: true,
        description: "Unique identifier of the team" 
      }),
      ApiBody({ 
        type: UpdateTeamWebsitesDto,
        description: "Arrays of website IDs to add and remove"
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "Websites successfully updated for the team" 
      }),
      ApiResponse({ 
        status: HttpStatus.BAD_REQUEST, 
        description: "Invalid team ID or invalid request payload" 
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
