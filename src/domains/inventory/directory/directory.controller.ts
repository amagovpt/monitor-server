import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  Body,
  HttpCode,
  Query,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { LoggingInterceptor } from 'src/core/log/log.interceptor';
import { CreateDirectory } from './dto/create-diretory.dto';
import { UpdateDirectory } from './dto/update-diretory.dto';
import { DirectoryDocs } from './directory.swagger';
import { DirectoryQueryRequestDTO } from './dto/request/query/directory-query-request.dto';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { DirectoryDTO } from './dto/directory.dto';
import { PaginationResponse } from 'src/common/repositories/base.repository';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@DirectoryDocs.controller()
@Controller('directories')
@UseInterceptors(LoggingInterceptor)
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @DirectoryDocs.findAll()
  @Get('')
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async getAllDirectoriesPaginated(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DirectoryQueryRequestDTO,
  ): Promise<PaginationResponse<DirectoryDTO>> {
    const securityContext = { user: user };
    return await this.directoryService.findAll(query, securityContext);
  }

  @DirectoryDocs.getDirectory()
  @Get(':directoryId')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_view_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async getDirectoryInfo(
    @Param('directoryId', ParseIntPipe) directoryId: number,
  ): Promise<DirectoryDTO> {
    return await this.directoryService.getDirectory(directoryId);
  }

  @DirectoryDocs.create()
  @Post('')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async createDirectory(@Body() createDirectory: CreateDirectory): Promise<DirectoryDTO> {
    return await this.directoryService.createOne(createDirectory);
  }

  @DirectoryDocs.update()
  @Patch('')
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_edit_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async updateDirectory(@Body() updateDirectory: UpdateDirectory): Promise<DirectoryDTO> {
    return await this.directoryService.update(updateDirectory);
  }

  @DirectoryDocs.delete()
  @Delete(':directoryId')
  @HttpCode(204)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async deleteDirectory(
    @Param('directoryId', ParseIntPipe) directoryId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const securityContext = { user: user };
    await this.directoryService.delete([directoryId], securityContext);
  }
}
