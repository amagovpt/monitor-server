import { ApiProperty } from "@nestjs/swagger";

export class TagWebsiteResponseDTO {
  @ApiProperty({ example: 1, description: "Unique identifier of the tag" })
  id: number;

  @ApiProperty({ example: "accessibility", description: "Tag name" })
  name: string;
}

export type TagWebsitesResponseDTO = TagWebsiteResponseDTO[];
