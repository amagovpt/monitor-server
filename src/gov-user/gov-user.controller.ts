import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { GovUserService } from "./gov-user.service";
import { CreateGovUserDto } from "./dto/create-gov-user.dto";
import { UpdateGovUserDto } from "./dto/update-gov-user.dto";
import { success } from "src/lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GovUser } from "./entities/gov-user.entity";
import { AuthGuard } from "@nestjs/passport";

@ApiBasicAuth()
@ApiTags("gov-user")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("gov-user")
@UseGuards(AuthGuard("jwt-admin"))
@UseInterceptors(LoggingInterceptor)
export class GovUserController {
  constructor(private readonly govUserService: GovUserService) {}

  @ApiOperation({ summary: "Create GovUser" })
  @ApiResponse({
    status: 200,
    description: "GovUser created",
    type: GovUser,
  })
  @Post("create")
  async create(@Body() createGovUserDto: CreateGovUserDto) {
    return success(await this.govUserService.create(createGovUserDto));
  }

  @ApiOperation({ summary: "Find all GovUsers" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<GovUser>,
  })
  @Get("all")
  async findAll() {
    return success(await this.govUserService.findAll());
  }

  @ApiOperation({ summary: "Check if a specific GovUser exists" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<GovUser>,
  })
  @Get("exists/:cc")
  async exists(@Param("cc") cc: string) {
    return success(await this.govUserService.checkIfExists(cc));
  }

  @ApiOperation({ summary: "Find a GovUser by id" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: GovUser,
  })
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return success(await this.govUserService.findOne(+id));
  }

  @ApiOperation({ summary: "Update a specific GovUser" })
  @ApiResponse({
    status: 200,
    description: "The specific GovUser was updated",
    type: GovUser,
  })
  @Post("update")
  async update(@Body() updateGovUserDto: UpdateGovUserDto) {
    return success(await this.govUserService.update(updateGovUserDto));
  }

  @ApiOperation({ summary: "Delete a specific GovUser" })
  @ApiResponse({
    status: 200,
    description: "The specific GovUser was deleted",
    type: GovUser,
  })
  @Post("delete")
  async remove(@Body() updateGovUserDto: UpdateGovUserDto) {
    return success(await this.govUserService.remove(updateGovUserDto.id));
  }
}
