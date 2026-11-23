import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AccessibilityStatementService } from './accessibility-statement.service';
import { AccessibilityStatementQueryDTO } from './dto/request/accessibility-statement-request.dto';
import { CurrentUser } from 'src/core/authorization/decorators/current-user.decorator';
import { AuthenticatedUser, RoleSlug } from 'src/core/authentication/interfaces/types';
import { AccessibilityStatementResponseDto } from './dto/accessibility-statement.response.dto';
import { AccessibilityStatementDocs } from './accessibility-statement.swagger';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';

@Controller('accessibility-statement')
export class AccessibilityStatementController {
  constructor(private readonly accessibilityStatementService: AccessibilityStatementService) {}

  @AccessibilityStatementDocs.findAll()
  @Get()
  @HttpCode(200)
  @Protected({
    roles: [RoleSlug.ADMIN],
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AccessibilityStatementQueryDTO,
  ) {
    return await this.accessibilityStatementService.getAll(user, query);
  }

  @AccessibilityStatementDocs.findOneById()
  @Get(':id')
  @HttpCode(200)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_view_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    return await this.accessibilityStatementService.findById(id);
  }

  @AccessibilityStatementDocs.upsert()
  @Post('')
  @HttpCode(200)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_edit_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async upsert(@Body() dto: AccessibilityStatementResponseDto) {
    return await this.accessibilityStatementService.upsertStatement(dto);
  }

  @AccessibilityStatementDocs.deleteById()
  @Delete(':id')
  @HttpCode(204)
  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: {
      objectType: 'role',
      action: 'can_manage_users',
      resourceIdResolver: () => 'ams',
    },
  })
  async deleteById(@Param('id', ParseIntPipe) id: number) {
    await this.accessibilityStatementService.deleteById(id);
  }
}
