import { Controller, Get, Put, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from "@nestjs/common";
import { WebsiteStampService } from "./stamp.service";
import { UpdateStampDto } from "./dto/update-stamp.dto";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { StampDocs } from "./stamp.swagger";
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@StampDocs.controller()
@Controller("websites/:websiteId/stamp")
export class WebsiteStampController {
  constructor(private readonly stampService: WebsiteStampService) {}
  
  @StampDocs.getStamp()
  @Get()
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
    objectType: 'role',
    action: 'can_view_users',
    resourceIdResolver: () => 'ams',
  },
  })
  async getStamp(
    @Param("websiteId", ParseIntPipe) websiteId: number
  ) {
    return this.stampService.getStampByWebsiteId(websiteId);
  }

  @StampDocs.upsertStamp()
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
  async upsertStamp(
    @CurrentUser() user: AuthenticatedUser,
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @Body() dto: UpdateStampDto,
  ) {
    return this.stampService.upsertStamp(
      websiteId,
      dto.stampLevel,
      dto.dateStamp,
      user.id,
    );
  }
}