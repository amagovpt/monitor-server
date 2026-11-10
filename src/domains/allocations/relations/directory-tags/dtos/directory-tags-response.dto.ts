import { ApiProperty } from "@nestjs/swagger";

export class DirectoryTagResponseDTO {
  @ApiProperty({ example: 1, description: "Unique identifier of the tag" })
  id: number;

  @ApiProperty({ example: "accessibility", description: "Tag name" })
  name: string;
}

export type DirectoryTagsResponseDTO = DirectoryTagResponseDTO[];
