import { ApiProperty } from "@nestjs/swagger";

export class InstitutionResponseDTO {
  @ApiProperty({ example: 1, description: "Unique identifier of the institution" })
  id: number;

  @ApiProperty({ example: "FCT", description: "Short name of the institution" })
  shortName: string;

  @ApiProperty({ example: "Fundação para a Ciência e a Tecnologia", description: "Long name of the institution" })
  longName: string;

  @ApiProperty({ example: "2025-01-15T10:30:00.000Z", description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ example: "2025-01-15T10:30:00.000Z", description: "Last update timestamp" })
  updatedAt: Date;
}
