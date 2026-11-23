import { Controller, Get, Put, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from "@nestjs/common";
import { WebsiteDeclarationService } from "./declaration.service";
import { UpdateDeclarationDto } from "./dto/update-declaration.dto";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { DeclarationDocs } from "./declaration.swagger";
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@DeclarationDocs.controller()
@Controller("websites/:websiteId/declaration")
export class WebsiteDeclarationController {
  constructor(private readonly declarationService: WebsiteDeclarationService) {}
  
  @DeclarationDocs.getDeclaration()
  @Get("")
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
          objectType: "role",
          action: "can_view_users",
          resourceIdResolver: () => "ams"
    },
  })
  async getDeclaration(
    @Param("websiteId", ParseIntPipe) websiteId: number
  ) {
    return this.declarationService.getDeclarationByWebsiteId(websiteId);
  }
  
  @DeclarationDocs.upsertDeclaration()
  @Put()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
              objectType: "role",
              action: "can_edit_users",
              resourceIdResolver: () => "ams"
    },
  })
  async upsertDeclaration(
    @CurrentUser() user: AuthenticatedUser,
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @Body() dto: UpdateDeclarationDto,
  ) {
    return this.declarationService.upsertDeclaration(
      websiteId,
      dto.status,
      dto.dateDeclaration,
      user.id
    );
  }
}