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
  UseGuards,
} from "@nestjs/common";
import { AccessibilityStatementService } from "./accessibility-statement.service";
import { AccessibilityStatementQueryDTO } from "./dto/request/accessibility-statement-request.dto";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { AccessibilityStatementDto } from "./dto/accessibility-statement.dto";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { FgaGuard } from "src/core/authorization/guards/fga.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";
import { AccessibilityStatementDocs } from "./accessibility-statement.swagger";

@Controller("accessibility-statement")
@UseGuards(JwtAuthGuard,RolesGuard,FgaGuard)
export class AccessibilityStatementController {
  constructor(
    private readonly accessibilityStatementService: AccessibilityStatementService,
  ) {}

  @AccessibilityStatementDocs.findAll()
  @Get()
  @Roles(RoleSlug.ADMIN)
  @HttpCode(200)
  async findAll( @CurrentUser() user: AuthenticatedUser, @Query() query: AccessibilityStatementQueryDTO) {
    return await this.accessibilityStatementService.getAll(user, query);
  }

  @AccessibilityStatementDocs.findOneById()
  @Get(":id")
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
          objectType: "role",
          action: "can_view_users",
          resourceIdResolver: () => "ams"
  })
  @HttpCode(200)
  async findOneById(@Param("id", ParseIntPipe) id: number) {
    return await this.accessibilityStatementService.findById(id);
  }

  @AccessibilityStatementDocs.upsert()
  @Post("")
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
          objectType: "role",
          action: "can_edit_users",
          resourceIdResolver: () => "ams"
  })
  @HttpCode(200)
  async upsert(@Body() dto: AccessibilityStatementDto) {
    return await this.accessibilityStatementService.upsertStatement(dto);
  }


  @AccessibilityStatementDocs.deleteById()
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
          objectType: "role",
          action: "can_manage_users",
          resourceIdResolver: () => "ams"
    })
  @Delete(":id")
  @HttpCode(204)
  async deleteById(@Param("id", ParseIntPipe) id: number) {
    await this.accessibilityStatementService.deleteById(id);
  }

}
