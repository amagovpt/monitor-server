import { ApiProperty } from "@nestjs/swagger";

export class TeamMemberResponseDTO {
  @ApiProperty({ example: 1, description: "Unique identifier of the user" })
  id: number;

  @ApiProperty({ example: "jdoe", description: "Username of the team member" })
  username: string;
}

export type TeamMembersResponseDTO = TeamMemberResponseDTO[];
