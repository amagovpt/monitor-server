import {
  Controller,
  Patch,
  Body,
  HttpStatus,
  HttpCode,
  Param,
  ParseIntPipe,
  Get,
} from '@nestjs/common';
import { UserWebsitesService } from './user-websites.service';
import { UpdateUserWebsitesDto } from './dtos/user-website-update.dto';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { UserWebsitesDocs } from './user-websites.swagger';
import { AMS_ROLE_EDITOR, AMS_ROLE_VIEWER } from 'src/core/authorization/policies/role.policies';
import { UserWebsitesResponseDTO } from './dtos/user-websites-response.dto';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@UserWebsitesDocs.controller()
@Controller('users/:userId/websites')
export class UserWebsitesController {
  constructor(private readonly service: UserWebsitesService) {}

  @Get('')
  @UserWebsitesDocs.getUserWebsites()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN, RoleSlug.MONITOR],
    fga: AMS_ROLE_VIEWER,
  })
  async getUserWebsites(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserWebsitesResponseDTO> {
    return await this.service.getUserWebsites(userId);
  }

  @Patch()
  @UserWebsitesDocs.updateUserWebsites()
  @HttpCode(HttpStatus.OK)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: AMS_ROLE_EDITOR,
  })
  async updateWebsites(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserWebsitesDto,
  ) {
    return await this.service.updateUserWebsites(userId, dto.add || [], dto.remove || []);
  }
}
