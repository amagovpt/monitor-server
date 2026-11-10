import { applyDecorators, HttpStatus } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiParam
} from "@nestjs/swagger";
import { UpdateTeamMembersDto } from "./dtos/tag-members-update.dto"; 
import { TeamMemberResponseDTO } from "./dtos/team-members-response.dto";
export const TeamMembersDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("team-members"),
      ApiBearerAuth(),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized - Missing or invalid authentication token" }),
      ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden - Requires Admin role and FGA authorization" })
    ),

  getTeamMembers: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Get members of a team",
        description: "Retrieves the list of users currently assigned to the specified team."
      }),
      ApiParam({ 
        name: "teamId", 
        type: Number, 
        required: true,
        description: "Unique identifier of the team" 
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "List of team members successfully retrieved",
        type: [TeamMemberResponseDTO]
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

  updateTeamMembers: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Update members of a team",
        description: "Atomically adds and/or removes users from the specified team's membership list."
      }),
      ApiParam({ 
        name: "teamId", 
        type: Number, 
        required: true,
        description: "Unique identifier of the team" 
      }),
      ApiBody({ 
        type: UpdateTeamMembersDto,
        description: "Arrays of user IDs to add and remove"
      }),
      ApiResponse({ 
        status: HttpStatus.OK, 
        description: "Team members successfully updated" 
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
