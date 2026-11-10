import { ApiProperty } from "@nestjs/swagger";

export class UserWebsiteResponseDTO {
  @ApiProperty({ example: 1, description: "Unique identifier of the website" })
  id: number;

  @ApiProperty({ example: "https://example.com", description: "Website base URL" })
  baseUrl: string;
}

export type UserWebsitesResponseDTO = UserWebsiteResponseDTO[];
