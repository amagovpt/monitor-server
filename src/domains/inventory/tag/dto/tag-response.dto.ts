import { ApiProperty } from "@nestjs/swagger";

export class TagResponseDTO {
  @ApiProperty({ example: 1, description: "Unique identifier of the tag" })
  id: number;

  @ApiProperty({ example: "accessibility", description: "Tag name" })
  name: string;

  @ApiProperty({ example: "Accessibility related tag", description: "Tag description", required: false })
  description?: string;

  @ApiProperty({ example: "2025-01-15T10:30:00.000Z", description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ example: "2025-01-15T10:30:00.000Z", description: "Last update timestamp" })
  updatedAt: Date;
}
